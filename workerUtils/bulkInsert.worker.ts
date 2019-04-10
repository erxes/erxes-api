try {
  // tslint:disable-next-line
  require('ts-node/register');
} catch (e) {
  console.log('register error', e.message);
}

// tslint:disable-next-line
const { parentPort } = require('worker_threads');

import { Companies, Customers } from '../src/db/models';

console.log(Customers, Companies);

parentPort.postMessage('Successfully created worker');
