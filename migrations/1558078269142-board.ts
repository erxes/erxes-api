import * as mongoose from 'mongoose';
import { connect } from '../src/db/connection';
import { Boards, Pipelines, Stages } from '../src/db/models';

/**
 * Rename coc field to contentType
 *
 */
module.exports.up = async () => {
  await connect();

  try {
    await mongoose.connection.db.collection('deal_boards').rename('boards');

    await Boards.updateMany({}, { $set: { type: 'deal' } });

    await mongoose.connection.db.collection('deal_pipelines').rename('pipelines');

    await Pipelines.updateMany({}, { $set: { type: 'deal' } });

    await mongoose.connection.db.collection('deal_stages').rename('stages');

    await Stages.updateMany({}, { $set: { type: 'deal' } });
  } catch (e) {
    console.log('board migration ', e.message);
  }

  return Promise.resolve('ok');
};
