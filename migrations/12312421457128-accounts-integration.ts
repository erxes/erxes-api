import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

module.exports.up = async () => {
  const { MONGO_URL = '' } = process.env;

  const apiMongoClient = await mongoose.createConnection(MONGO_URL, options);

  const apiAccounts = apiMongoClient.db.collection('accounts');
  const apiIntegrations = apiMongoClient.db.collection('integrations');

  const accounts = await apiAccounts
    .find()
    .project({ _id: 0 })
    .toArray();
  const integrations = await apiIntegrations
    .aggregate([
      { $match: { facebookData: { $exists: true } } },
      {
        $project: {
          _id: 0,
          kind: 1,
          erxesApiId: '$_id',
          facebookPageIds: '$facebookData.pageIds',
          accountId: '$facebookData.accountId',
        },
      },
    ])
    .toArray();

  // Switch to erxes-integrations database
  const integrationMongoClient = apiMongoClient.useDb('erxes-integrations');

  await integrationMongoClient.db.collection('accounts').insertMany(accounts);
  await integrationMongoClient.db.collection('integrations').insertMany(integrations);
};
