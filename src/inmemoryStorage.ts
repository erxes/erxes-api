import * as dotenv from 'dotenv';
import * as memoryStorage from 'erxes-inmemory-storage';

// load environment variables
dotenv.config();

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
}: {
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
} = process.env;

memoryStorage.init(
  REDIS_HOST
    ? {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
      }
    : {},
);
