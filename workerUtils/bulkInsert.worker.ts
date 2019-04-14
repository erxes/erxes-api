import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { Companies, Customers } from '../src/db/models';

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
  async () => {
    const errMsgs: string[] = [];

    const { result, contentType, properties, user } = workerData;

    let collection: any = Customers;

    if (contentType === 'company') {
      collection = Companies;
    }

    const history: {
      ids: string[];
      success: number;
      total: number;
      contentType: string;
      failed: number;
    } = {
      ids: [],
      success: 0,
      total: result.length,
      contentType,
      failed: 0,
    };

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
      await collection
        .create(coc, user)
        .then(cocObj => {
          // Increasing success count
          history.success++;
          history.ids.push(cocObj._id);
        })
        .catch(e => {
          // Increasing failed count and pushing into error message
          history.failed++;
          errMsgs.push(e.message);
        });
    }

    return errMsgs;
  },
);

// collection.bulkInsert(fieldNames, result, user);

parentPort.postMessage('Successfully created worker');
