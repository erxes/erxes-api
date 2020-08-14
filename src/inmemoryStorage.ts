import * as dotenv from 'dotenv';
import memoryStorage from 'erxes-inmemory-storage';
import { debugBase } from './debuggers';

// load environment variables
dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

debugBase(`Memory storage using: ${REDIS_HOST ? 'Redis' : 'Local'}`);

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
