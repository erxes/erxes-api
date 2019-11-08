import { createConnection } from 'mongoose';

const main = async () => {
  const mongoClient = await createConnection(process.env.MONGO_URL || '', {
    useNewUrlParser: true,
    useCreateIndex: true,
  });

  const recycleCleanerInKey = async coll => {
    const collection = mongoClient.db.collection(coll);
    const fields = mongoClient.db.collection('fields');
    const entries = await collection
      .aggregate([{ $match: { customFieldsData: { $exists: true } } }, { $project: { _id: 1, customFieldsData: 1 } }])
      .toArray();

    for (const entry of entries) {
      const tempDic = entry.customFieldsData;
      let checkCount = 0;

      Object.keys(tempDic).forEach(async key => {
        const len = await fields.find({ _id: key }).count();
        if (len === 0) {
          delete tempDic[key];
          checkCount = +1;
        }
      });

      if (checkCount > 0) {
        await collection.updateOne({ _id: entry._id }, { $set: { customFieldsData: tempDic } });
      }
    }
  };

  await recycleCleanerInKey('products');
  await recycleCleanerInKey('companies');
};

main();
