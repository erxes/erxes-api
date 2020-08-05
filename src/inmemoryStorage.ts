import * as dotenv from 'dotenv';
import * as redis from 'redis';
import * as memoryClient from './memoryStorage/memory';
import * as redisClient from './memoryStorage/redis';

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

let client;

if (redisOptions.host) {
  client = redisClient;

  redisClient.init(redis.createClient(redisOptions));
} else {
  client = memoryClient;
}

export default client;
