import { connect } from '../db/connection';

let db;

beforeAll(async done => {
  jest.setTimeout(30000);

  db = await connect(
    (process.env.TEST_MONGO_URL || '').replace(
      'test',
      `erxes-test-${Math.random()
        .toString()
        .replace(/\./g, '')}`,
    ),
    3,
  );

  done();
});

afterAll(async () => {
  await db.connection.dropDatabase();

  await db.connection.close();
});
