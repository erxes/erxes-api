import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers, ImportHistory } from '../src/db/models';

dotenv.config();

const { MONGO_URL = '' } = process.env;

mongoose.connect(
  MONGO_URL,
  { useNewUrlParser: true, useCreateIndex: true },
  async err => {
    if (err) {
      console.log('error', err);
    }

    const { result, contentType, properties, user, importHistoryId, percentagePerData } = workerData;

    let create: any = Customers.createCustomer;

    if (contentType === 'company') {
      create = Companies.createCompany;
    }

    // Iterating field values
    for (const fieldValue of result) {
      const inc: { success: number; failed: number; percentage: number } = {
        success: 0,
        failed: 0,
        percentage: percentagePerData,
      };

      const push: { ids?: string; errorMsgs?: string } = {};

      const coc = {
        customFieldsData: {},
      };

      let colIndex = 0;

      // Iterating through detailed properties
      for (const property of properties) {
        // Checking if it is basic info field
        if (property.isCustomField === false) {
          coc[property.name] = fieldValue[colIndex];
        } else {
          coc.customFieldsData[property.id] = fieldValue[colIndex];
        }

        colIndex++;
      }

      // Creating coc
      await create(coc, user)
        .then(cocObj => {
          inc.success++;
          // Increasing success count
          push.ids = cocObj._id;
        })
        .catch(e => {
          inc.failed++;
          // Increasing failed count and pushing into error message
          push.errorMsgs = e.message;
        });

      await ImportHistory.updateOne({ _id: importHistoryId }, { $inc: inc, $push: push });
    }
  },
);

// collection.bulkInsert(fieldNames, result, user);

parentPort.postMessage('Successfully created worker');
