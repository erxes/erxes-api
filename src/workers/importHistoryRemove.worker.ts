import * as mongoose from 'mongoose';
import { connect } from '../db/connection';
import { Companies, Customers, ImportHistory } from '../db/models';
import { graphqlPubsub } from '../pubsub';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

connect().then(async () => {
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
    graphqlPubsub.publish('importHistoryChanged', {
      importHistoryChanged: {
        _id: historyObj._id,
        status: 'Removed',
        percentage: 100,
      },
    });

    await ImportHistory.deleteOne({ _id: importHistoryId });
  }

  mongoose.connection.close();

  parentPort.postMessage('Successfully finished job');
});
