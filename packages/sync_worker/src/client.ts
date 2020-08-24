import { Worker, receiveMessageOnPort, MessageChannel } from 'worker_threads';
import { FunctionCallMessage, FunctionReturnMessage, WorkerData } from './protocol';
import { promisify } from 'util';
import { assert } from 'console';
import { debug, setImmediateP, T } from './misc';

export function createWorker(workerScript: string) {
    const {port1: workerPort, port2: mainPort} = new MessageChannel();
    const sharedBuffer = new SharedArrayBuffer(8);
    const sharedBufferView = new Int32Array(sharedBuffer);
    const worker = new Worker(workerScript, {
        workerData: T<WorkerData>({
            workerPort,
            sharedBuffer
        }),
        transferList: [workerPort]
    });

    mainPort.start();

    let nextSequenceNumber = 0;
    function callFunction(functionName: string, args: any[]) {
        const sequenceNumber = nextSequenceNumber++;
        debug(`main thread sending message ${sequenceNumber}`);
        const signalBefore = Atomics.load(sharedBufferView, 0);
        mainPort.postMessage(T<FunctionCallMessage>({type: 'functionCall', args, functionName, sequenceNumber}));
        debug(`main thread Atomics.wait for ${signalBefore}`);
        const result = Atomics.wait(sharedBufferView, 0, signalBefore);
        debug('main thread getting message');
        const response = receiveMessageOnPort(mainPort);
        assert(response);
        const returnMessage = response!.message as FunctionReturnMessage;
        assert(returnMessage.sequenceNumber === sequenceNumber);
        debug(`main thread got ${ returnMessage.returnOrError }`);
        if(returnMessage.returnOrError === 'error') {
            throw returnMessage.error;
        }
        return returnMessage.returnValue;
    }

    function terminateWorker() {
        worker.terminate();
    }

    return {callFunction, terminateWorker};
}

export function createWorkerProxy<T>(callFunction: ReturnType<typeof createWorker>['callFunction']): T {
    const fnCache = new Map<string, any>();
    return new Proxy({}, {
        get(target: T, p: PropertyKey, receiver: any) {
            const pString = p as string;
            let cached = fnCache.get(pString);
            if(!cached) {
                cached = proxyToCallFunction;
                fnCache.set(pString, cached);
            }
            return cached;
            function proxyToCallFunction(...args: any[]) {
                return callFunction(pString, args);
            }
        }
    }) as unknown as T;
}