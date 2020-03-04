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

let client;

export const initRedis = (callback?: (client) => void) => {
  client = redis.createClient(redisOptions);

  if (callback) {
    callback(client);
  }
};

/*
 * Get item
 */
export const get = (key: string, defaultValue?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (NODE_ENV === 'test') {
      return resolve(defaultValue || '');
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
 * Check if value exists in set
 */
export const inArray = async (setKey: string, setMember: string): Promise<any> => {
  try {
    const response = await new Promise((resolve, reject) => {
      client.sismember(setKey, setMember, (error, reply) => {
        if (error) {
          return reject(error);
        }

        return resolve(reply);
      });
    });

    return response;

    // handle already stored invalid type error
  } catch (e) {
    if (e.message.includes('WRONGTYPE')) {
      client.del(setKey);
    }

    return false;
  }
};

/*
 * Add a value to a set or do nothing if it already exists
 */
export const addToArray = (setKey: string, setMember: string) => {
  return new Promise((resolve, reject) => {
    client.sadd(setKey, setMember, (error, reply) => {
      if (error) {
        return reject(error);
      }

      return resolve(reply);
    });
  });
};

/*
 * Remove a value from a set or do nothing if it is not present
 */
export const removeFromArray = (setKey: string, setMember: string) => {
  return new Promise((resolve, reject) => {
    client.srem(setKey, setMember, (error, reply) => {
      if (error) {
        return reject(error);
      }

      return resolve(reply);
    });
  });
};
