try {
  // tslint:disable-next-line
  require('ts-node/register');
} catch (e) {
  console.log('register error', e.message);
}

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers } from '../src/db/models';

/**
 * Returns collection by name
 */
const getCollectionByName = (name: string) => {
  name = name.toLowerCase();
  let collectionObj: any = null;

  switch (name) {
    case 'customers':
      collectionObj = Customers;
      break;

    case 'companies':
      collectionObj = Companies;
      break;

    default:
      break;
  }

  return collectionObj;
};

const { fieldNames, type, result, user } = workerData;

const collection = getCollectionByName(type);

if (!collection) {
  throw new Error('Wrong import type');
}

collection.bulkInsert(fieldNames, result, user);

parentPort.postMessage('Successfully created worker');
