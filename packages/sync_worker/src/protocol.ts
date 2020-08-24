import type {MessagePort} from 'worker_threads';

/*
 * ALL OF THIS COMMENT IS IRRELEVANT.
 * It comes from before I figured out how to synchronously `postMessage`.
 * 
 * Sending and receiving both happen over the same SharedArrayBuffer.
 *
 * 2x threads:
 * - sender: this is the thread that makes a synchronous, blocking call to the worker, and is blocked waiting for a response
 * - receiver: this is the thread that waits for a call from the sender, runs (asynchronous) workload, and replies to the sender with a response
 * 
 * States are:
 * 0: nothing in-flight
 * 1: sender has written a chunk of a multi-chunk message
 * 2: receiver has read most recent chunk and is waiting for next one
 * 3: sender has written last chunk of a single- or multi-chunk message
 * 4: receiver has written a chunk of a multi-chuink response
 * 5: sender has read most recent chunk and is waiting for next one
 * 6: receiver has written last chunk of a single- or multi-chunk message
 * 
 * Sequence for a short (1-chunk) request and short response:
 * 0 -> 3 -> 6
 * 
 * Sequence for 3-chunk request and short response:
 * 0 -> 1 -> 2 -> 1 -> 2 -> 3 -> 6
 * 
 * Sequence for a short request and 3-chunk response:
 * 0 -> 3 -> 4 -> 5 -> 4 -> 5 -> 6
 */

export const enum State {
  Idle = 0,
  SenderWroteChunk = 1,
  ReceiverAwaitingNextChunk = 2,
  SenderWroteLastChunk = 3,
  ReceiverWroteChunk = 4,
  SenderAwaitingNextChunk = 5,
  ReceiverWroteLastChunk = 6
}

export const BUFFER_STATE = 0;
export const BUFFER_CHUNK_LENGTH_BYTES = 1;
export const MAX_SIGNED_32_BIT_INT = 2147483647;
// 1MB: too large?
export const BUFFER_SIZE = 1<<6;
export const MAX_CHUNK_SIZE = BUFFER_SIZE - 8;

export interface WorkerData {
  sharedBuffer: SharedArrayBuffer;
  workerPort: MessagePort;
}

export type Message = FunctionCallMessage;

export interface FunctionCallMessage {
    type: 'functionCall';
    functionName: string;
    sequenceNumber: number;
    args: any[];
}
export interface FunctionReturnMessage {
    type: 'functionReturn';
    sequenceNumber: number;
    returnOrError: 'return' | 'error';
    returnValue?: any;
    error?: any;
}
