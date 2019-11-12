import * as dotenv from 'dotenv';
import { createConnection } from 'mongoose';

dotenv.config();

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

const main = async () => {
  const mongoClient = await createConnection(process.env.MONGO_URL || '', options);

  const recycleCleanerInKey = async coll => {
    const collection = mongoClient.db.collection(coll);
    const fields = mongoClient.db.collection('fields');
    const entries = await collection
      .aggregate([{ $match: { customFieldsData: { $exists: true } } }, { $project: { _id: 1, customFieldsData: 1 } }])
      .toArray();

    entries.forEach(async entry => {
      const tempDic = entry.customFieldsData;
      let checkCount = 0;

      // todo fix unwait
      Object.keys(tempDic).forEach(async key => {
        const len = await fields.find({ _id: key }).count();
        if (len === 0) {
          delete tempDic[key];
          checkCount += 1;
        }
      });

      if (checkCount > 0) {
        await collection.updateOne({ _id: entry._id }, { $set: { customFieldsData: tempDic } });
      }
    });
  };

  await recycleCleanerInKey('products');
  await recycleCleanerInKey('companies');

  process.exit();
};

main();
