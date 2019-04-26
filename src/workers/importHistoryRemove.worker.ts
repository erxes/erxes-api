import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers } from '../db/models';

dotenv.config();

const { MONGO_URL = '' } = process.env;

mongoose.connect(
  MONGO_URL,
  { useNewUrlParser: true, useCreateIndex: true },
  async err => {
    if (err) {
      console.log('error', err);
    }

    const { result, contentType } = workerData;

    let collection: any = Companies;

    if (contentType === 'customer') {
      collection = Customers;
    }

    await collection.deleteMany({ _id: { $in: result } });

    mongoose.connection.close();

    parentPort.postMessage('Successfully finished job');
  },
);
