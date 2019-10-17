import { connect } from '../db/connection';
import { Companies, Customers, Deals, GrowthHacks, Tasks, Tickets } from '../db/models';
import { fillSearchTextItem } from '../db/models/boardUtils';

module.exports.up = async () => {
  await connect();

  const executer = async (objectType, converter) => {
    const entries = await objectType.find({});
    console.log(objectType.modelName, entries.length);

    for (const entry of entries) {
      const searchText = converter(entry);
      await objectType.updateOne({ _id: entry._id }, { $set: { searchText } });
    }
  };

  await executer(Customers, Customers.fillSearchText);

  await executer(Companies, Companies.fillSearchText);

  await executer(Deals, fillSearchTextItem);

  await executer(Tasks, fillSearchTextItem);

  await executer(Tickets, fillSearchTextItem);

  await executer(GrowthHacks, fillSearchTextItem);

  return Promise.resolve('ok');
};
