// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

const data = workerData;
console.log('from worker', data);

parentPort.postMessage('Dun');
