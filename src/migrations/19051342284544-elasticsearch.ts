import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { Segments } from '../db/models';
import { ICondition } from '../db/models/definitions/segments';

dotenv.config();

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

module.exports.up = async () => {
  const { MONGO_URL = '' } = process.env;

  const mongoClient = await mongoose.createConnection(MONGO_URL, options);

  const segmentsCollection = mongoClient.db.collection('segments');

  const segments = await segmentsCollection.find().toArray();

  for (const segment of segments) {
    const { conditions = [] } = segment;
    const newConditions: ICondition[] = [];

    for (const condition of conditions) {
      newConditions.push({
        ...condition,
        type: 'property',
        propertyName: condition.field,
        propertyOperator: condition.operator,
        propertyValue: condition.value,
      });
    }

    await Segments.updateOne({ _id: segment._id }, { $set: { conditions: newConditions } });
  }
};
