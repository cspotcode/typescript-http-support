import { promisify } from "util";

export function T<T>(t: T) {return t}
export function debug(...args: any[]) {
    // console.log(...args);
}

export const setImmediateP = promisify(setImmediate);
