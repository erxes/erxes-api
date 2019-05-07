import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers, ImportHistory } from '../db/models';

dotenv.config();

const { MONGO_URL = '' } = process.env;

mongoose.connect(
  MONGO_URL,
  { useNewUrlParser: true, useCreateIndex: true },
  async err => {
    if (err) {
      console.log('error', err);
    }

    const { result, contentType, importHistoryId } = workerData;

    let collection: any = Companies;

    if (contentType === 'customer') {
      collection = Customers;
    }

    for (const id of result) {
      await collection.deleteOne({ _id: id });

      await ImportHistory.updateOne({ _id: importHistoryId }, { $pull: { ids: id } });
    }

    const historyObj = await ImportHistory.findOne({ _id: importHistoryId });

    if (historyObj && (historyObj.ids || []).length === 0) {
      await ImportHistory.deleteOne({ _id: importHistoryId });
    }

    mongoose.connection.close();

    parentPort.postMessage('Successfully finished job');
  },
);
