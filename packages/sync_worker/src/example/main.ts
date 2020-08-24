import { promisify } from 'util';
import {createWorker, createWorkerProxy} from '../client';
import type {MyService} from './worker';

async function main() {
    const worker = createWorker(require.resolve('./worker'));
    const proxy = createWorkerProxy<MyService>(worker.callFunction);
    let i = 0;
    while(true) {
        const result = proxy.sayHi(`Sam${i++}`);
        console.log(result);
    }
}

main();