import * as mongoose from 'mongoose';
// import { Conformities, ConversationMessages, Customers, EngageMessages, Deals } from '../db/models';
import { Conformities } from '../db/models';

module.exports.up = async () => {
  const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', {
    useNewUrlParser: true,
    useCreateIndex: true,
  });

  const executer = async (objOnDb, relModels, conformity = '') => {
    const entries = await objOnDb.find().toArray();

    for (const entry of entries) {
      console.log('************************************************');
      const oldId = entry._id;
      console.log('oldId', oldId);
      const doc = { ...entry, oldId };
      delete doc._id;
      const response = await objOnDb.insertOne(doc);

      if (!response.insertedId) {
        continue;
      }

      console.log(response);
      const newId = response.insertedId;
      console.log('newId', newId);

      if (conformity) {
        Conformities.changeConformity({ type: conformity, oldTypeIds: [oldId], newTypeId: newId });
      }

      for (const relModel of relModels) {
        if (relModel.isMany) {
          const relEntries = await relModel.find({ [relModel.fi]: { $in: oldId } }, { _id: 1, [relModel.fi]: 1 });

          for (const relEntry of relEntries) {
            const oldList = relEntry[relModel.fi];
            const index = oldList.indexof(oldId);

            if (index !== -1) {
              oldList[index] = newId;
              await relEntry.updateOne({ _id: relEntry._id }, { $set: { [relModel.fi]: oldList } });
            }
          }
        } else {
          await relModel.updateMany({ [relModel.fi]: oldId }, { $set: { [relModel.fi]: newId } });
        }
      }

      await objOnDb.deleteOne({ _id: oldId });
    }
  };

  // await executer(Users, [{coll: Boards, fi: 'userId'}, {coll: }], 'customer');
  await executer(mongoClient.db.collection('deals'), [], 'customer');

  return Promise.resolve('ok');
};
