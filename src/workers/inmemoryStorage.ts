import * as dotenv from 'dotenv';
import memoryStorage from 'erxes-inmemory-storage';

// load environment variables
dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

let client;

export const initRedis = () => {
  client = memoryStorage({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  });
};

export default function() {
  return client;
}
