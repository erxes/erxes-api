import * as dotenv from 'dotenv';
import * as shelljs from 'shelljs';
import { getEnv } from '../data/utils';
import { connect } from '../db/connection';
import { Users } from '../db/models';

dotenv.config();

const main = async () => {
  const MONGO_URL = getEnv({ name: 'MONGO_URL', defaultValue: 'mongodb://localhost/erxes-cypress' });

  const connection = await connect(MONGO_URL);

  const dbName = connection.connection.db.databaseName;
  console.log(`drop and create database: ${dbName}`)

  await connection.connection.dropDatabase();

  const result = await shelljs.exec(`mongorestore --uri "${MONGO_URL}" --db ${dbName} ./src/initialData/frontTestData`, {
    silent: true,
  });
  const output = result.stderr + result.stdout;

  console.log(output);

  console.log(`success, imported initial data to: ${dbName}`)

  const newPwd = '8p1Je7CQOF';
  const pwdHash = await Users.generatePassword(newPwd);

  await shelljs.exec(`mongo "${MONGO_URL}" --eval 'db.users.update({}, { $set: {password: "${pwdHash}" } })'`, {
    silent: true,
  });

  await shelljs.exec(`yarn migrate`);

  console.log('\x1b[32m%s\x1b[0m', 'Your new password: ' + newPwd);

  process.exit();
};

main();
