import * as dotenv from 'dotenv';
import * as memoryStorage from 'erxes-inmemory-storage';

// load environment variables
dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

memoryStorage.init({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
});
