import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { moduleObjects } from '../data/permissions/actions/permission';
import { actionsMap, registerModule } from '../data/permissions/utils';

dotenv.config();

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

const checkPermissionAll = async () => {
  console.log('-------start check or repair permission has a all-------');
  const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', options);

  const permissionsColl = mongoClient.db.collection('permissions');

  const permissions = await permissionsColl.find({ action: new RegExp('All') }).toArray();

  registerModule(moduleObjects);

  for (const perm of permissions) {
    const action = actionsMap[perm.action];

    if (!action) {
      console.log('DeprecationWarning', perm.action);
      await permissionsColl.deleteOne({ _id: perm._id });
      continue;
    }

    const source = action.use;
    const saved = perm.requiredActions;

    const excess = saved.filter(e => !source.includes(e));
    const less = source.filter(e => !saved.includes(e));
    if (excess.length === 0 && less.length === 0) {
      continue;
    }

    await permissionsColl.updateOne({ _id: perm._id }, { $set: { requiredActions: source } });
    console.log(excess);
    console.log(saved);
  }

  process.exit();
};

// const checkMigrationComplete = async () => {
//   const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', options);

//   const migrations = mongoClient.db.collection('migrations');

//   await migrations.deleteMany({});

//   process.exit();
// };

// const checkInitialComplete = async () => {
//   const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', options);

//   const migrations = mongoClient.db.collection('migrations');

//   await migrations.deleteMany({});

//   process.exit();
// };

checkPermissionAll();

// checkMigrationComplete();

// checkInitialComplete();
