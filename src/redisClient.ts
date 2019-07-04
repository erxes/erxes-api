import * as dotenv from 'dotenv';
import * as redis from 'redis';

// load environment variables
dotenv.config();

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379,
  REDIS_PASSWORD,
  NODE_ENV,
}: {
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  NODE_ENV?: string;
} = process.env;

/**
 * Docs on the different redis options
 * @see {@link https://github.com/NodeRedis/node_redis#options-object-properties}
 */
export const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  connect_timeout: 15000,
  enable_offline_queue: true,
  retry_unfulfilled_commands: true,
  retry_strategy: options => {
    // reconnect after
    return Math.max(options.attempt * 100, 3000);
  },
};

let client = {
  get: (_key, _callback) => true,
  set: (_key, _value) => true,
};

export const initRedis = () => {
  client = redis.createClient(redisOptions);
};

/*
 * Get item
 */
export const get = (key: string, defaultValue?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (NODE_ENV === 'test') {
      return resolve('');
    }

    client.get(key, (error, reply) => {
      if (error) {
        return reject(error);
      }

      return resolve(reply && reply !== 'nil' ? reply : defaultValue);
    });
  });
};

/*
 * Set item
 */
export const set = (key: string, value: any) => {
  if (NODE_ENV === 'test') {
    return;
  }

  client.set(key, value);
};

/*
 * Get array
 */
export const getArray = async (key: string): Promise<any> => {
  const value = await get(key, '[]');

  return JSON.parse(value);
};

/*
 * Set array
 */
export const setArray = (key: string, value: any[]) => {
  client.set(key, JSON.stringify(value));
};
