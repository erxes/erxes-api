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
      await ConversationMessages.updateMany({}, { $set: { date: 1 } });
      let messageCount = await ConversationMessages.countDocuments({ date: 1 });
      while (messageCount > 0) {
        console.log(messageCount);

        for (const convMessage of await ConversationMessages.find({ date: 1 })
          .select({ createdAt: 1, userId: 1, fromBot: 1 })
          .limit(200)) {
          const date = await convMessage.createdAt;
          let dateInt = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
          const userId = await convMessage.userId;
          const fromBot = await convMessage.fromBot;
          if (userId || fromBot) {
            dateInt = 0;
          }
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
