console.log('from ts file');

import { Companies, Customers } from '../db/models';

console.log(Companies, Customers);
// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

const { type, fieldNames, usedSheets, user } = workerData;

let collection;

switch (type) {
  case 'customers':
    collection = Customers;
    break;

  case 'companies':
    collection = Companies;
    break;

  default:
    throw new Error('Invalid import type');
}

try {
  console.log(collection, fieldNames, usedSheets, user);
} catch (e) {
  console.log(e.message);
}

parentPort.postMessage('Dun');
