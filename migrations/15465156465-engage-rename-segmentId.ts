import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { EngageMessages } from '../src/db/models';

dotenv.config();

/**
 * Rename engage's segmentId to segmentIds
 *
 */
module.exports.up = next => {
  const { MONGO_URL = '' } = process.env;

  mongoose.connect(
    MONGO_URL,
    { useNewUrlParser: true, useCreateIndex: true },
    async () => {
      await EngageMessages.collection.updateMany(
        { segmentId: { $exists: true } },
        { $rename: { segmentId: 'segmentIds' } },
      );
      await EngageMessages.find()
        .cursor()
        .eachAsync((e: any) => {
          if (!e.segmentIds) {
            return;
          }

          e.segmentIds = [e.segmentIds];
          e.save();
        });

      next();
    },
  );
};
