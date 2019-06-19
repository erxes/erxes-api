import * as dotenv from 'dotenv';
import * as redis from 'redis';

// load environment variables
dotenv.config();

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379,
  REDIS_PASSWORD,
}: {
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
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

const client = redis.createClient(redisOptions);

/*
 * Get item
 */
export const get = (key: string): Promise<any> =>
  new Promise((resolve, reject) => {
    client.get(key, (error, reply) => {
      if (error) {
        return reject(error);
      }

      return resolve(reply);
    });
  });

/*
 * Set item
 */
export const set = (key: string, value: any) => client.set(key, value);
