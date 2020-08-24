import { workerData } from 'worker_threads';
import type { Message, FunctionCallMessage, WorkerData, FunctionReturnMessage } from './protocol';
import assert from 'assert';
import { debug, T } from './misc';

export function initializeWorker() {

    debug('starting worker');

    const typedWorkerData = workerData as WorkerData;
    const {sharedBuffer, workerPort} = typedWorkerData;
    const sharedBufferView = new Int32Array(sharedBuffer);

    // workerPort.start();

    workerPort.on('message', (message: Message) => {
        debug('worker received message', message);
        switch(message.type) {
            case 'functionCall':
                handleFunctionCall(message);
            break;
            default:
                throw new Error('unexpected message type');
        }
    });
    workerPort.on('messageerror', (error) => {
        debug('worker received messageerror', error);
    });

    async function handleFunctionCall(sendMessage: FunctionCallMessage) {
        const {args, functionName, sequenceNumber} = sendMessage;
        try {
            const returnValue = await functions[functionName].call(null, ...args);

            workerPort.postMessage(T<FunctionReturnMessage>({
                type: 'functionReturn',
                sequenceNumber,
                returnOrError: 'return',
                returnValue
            }));
        } catch(error) {
            workerPort.postMessage(T<FunctionReturnMessage>({
                type: 'functionReturn',
                sequenceNumber,
                returnOrError: 'error',
                error
            }));
        }
        Atomics.add(sharedBufferView, 0, 1);
        const awokenCount = Atomics.notify(sharedBufferView, 0);
    }

    const functions: Record<string, Function> = Object.create(null);

    debug('worker started');

    return {functions};
}