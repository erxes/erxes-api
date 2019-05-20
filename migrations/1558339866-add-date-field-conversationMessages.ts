import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { ConversationMessages } from '../src/db/models';

dotenv.config();

/**
 * Update dateField using createdAt value
 * createdAt.setHours(0, 0, 0, 0)
 */
module.exports.up = next => {
  const { MONGO_URL = ' ' } = process.env;

  mongoose.connect(
    MONGO_URL,
    { useNewUrlParser: true, useCreateIndex: true },
    async () => {
      console.log('Ensuring indexes...');
      await ConversationMessages.ensureIndexes();
      console.log('Ensuring indexes complete');
      let bulkOps: any = [];
      console.log('Counting date:null fields');
      let messageCount = await ConversationMessages.find({ date: null }).countDocuments();
      while (messageCount > 0) {
        for (const convMessage of await ConversationMessages.find({ date: null })
          .select('createdAt')
          .limit(200)) {
          const date = await convMessage.createdAt;
          await date.setHours(0, 0, 0, 0);
          bulkOps.push({
            updateOne: {
              filter: {
                _id: convMessage._id,
              },
              update: {
                $set: { date },
              },
            },
          });
        }
        messageCount -= 200;
        console.log(messageCount);
        await ConversationMessages.bulkWrite(bulkOps);
        bulkOps = [];
      }
      next();
    },
  );
};
