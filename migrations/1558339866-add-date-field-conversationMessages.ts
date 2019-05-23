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
      let messageCount = await ConversationMessages.countDocuments();
      while (messageCount > 0) {
        console.log(messageCount);

        for (const convMessage of await ConversationMessages.find({ date: { $exists: false } })
          .select('createdAt')
          .limit(200)) {
          const date = await convMessage.createdAt;
          const dateInt = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
          bulkOps.push({
            updateMany: {
              filter: {
                _id: convMessage._id,
              },
              update: {
                $set: { date: dateInt },
              },
            },
          });
        }
        messageCount -= 200;

        if (bulkOps.length > 0) {
          await ConversationMessages.bulkWrite(bulkOps);
        }

        bulkOps = [];
      }
      next();
    },
  );
};
