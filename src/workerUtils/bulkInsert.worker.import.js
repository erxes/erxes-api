// const { workerData, parentPort } = require('worker_threads');
const ts = require('ts-node');
const path = require('path');

try {
  ts.register();
} catch (e) {
  console.log('register error', e.message);
}

// console.log('sum fking js file before path');
// require('ts-node/register');

// // import path from 'path';
// console.log('before node register');
// // import ts from 'ts-node';
// // ts.register();
// console.log('after node register');
// // module.exports = () => {};
console.log('after register');
try {
  require(path.resolve(__dirname, './bulkInsert.worker.ts'));
  console.log('resolved our file', path.resolve(__dirname, './bulkInsert.worker.ts'));
} catch (e) {
  console.log('path resolve error', e.message);
}

// parentPort.postMessage(workerData);
