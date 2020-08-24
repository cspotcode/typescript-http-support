import {initializeWorker} from '../worker';

export type MyService = typeof myService;
const myService = {
    sayHi(name: string) {
        return `Hello, ${name}!`;
    }
};

const {functions} = initializeWorker();
Object.assign(functions, myService);
