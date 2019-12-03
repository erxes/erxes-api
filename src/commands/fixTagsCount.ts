import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

const fixTagCounts = async () => {
  console.log('-------start fix object counts of tags-------');
  const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', options);
  const tagsColl = mongoClient.db.collection('tags');
  const tags = await tagsColl.find().toArray();

  let collection = '';

  for (const tag of tags) {
    const type = tag.type;

    switch (type) {
      case 'customer':
        collection = 'customers';
        break;
      case 'engageMessage':
        collection = 'engage_messages';
        break;
      case 'company':
        collection = 'companies';
        break;
      case 'integration':
        collection = 'integrations';
        break;
      case 'product':
        collection = 'products';
        break;
    }

    const count = await mongoClient.db
      .collection(collection)
      .find({ tagIds: { $in: [tag._id] } })
      .count();

    if (count !== tag.objectCount) {
      await tagsColl.updateOne({ _id: tag._id }, { $set: { objectCount: count } });
      console.log(`fixed ${tag.name} of ${tag.type}`);
    }
  }
  process.exit();
};

fixTagCounts();
