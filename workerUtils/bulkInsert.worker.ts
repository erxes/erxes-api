import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers, ImportHistory } from '../src/db/models';

/**
 * Returns collection by name
 */
export const getCollectionByName = (name: string) => {
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

dotenv.config();

const { MONGO_URL = '' } = process.env;

mongoose.connect(
  MONGO_URL,
  { useNewUrlParser: true, useCreateIndex: true },
  async err => {
    if (err) {
      console.log('error', err);
    }

    const errors: string[] = [];

    const { result, contentType, properties, user, importHistoryId } = workerData;

    let create: any = Customers.createCustomer;

    if (contentType === 'company') {
      create = Companies.createCompany;
    }

    const ids: string[] = [];
    let success = 0;
    let failed = 0;

    // Iterating field values
    for (const fieldValue of result) {
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
          // Increasing success count
          success++;
          ids.push(cocObj._id);
        })
        .catch(e => {
          // Increasing failed count and pushing into error message
          failed++;
          errors.push(e.message);
        });
    }

    console.log(success, failed, ids);

    await ImportHistory.updateOne({ _id: importHistoryId }, { $addToSet: { ids }, $inc: { success, failed } });
  },
);

// collection.bulkInsert(fieldNames, result, user);

parentPort.postMessage('Successfully created worker');
