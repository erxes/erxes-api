let client;

export const init = redisClient => {
  client = redisClient;
};

/*
 * Get item
 */
export const get = (key: string, defaultValue?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
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
  client.set(key, value);
};

export const getArray = async (key: string, defaultValue = []): Promise<any> => {
  try {
    const response = await new Promise((resolve, reject) => {
      client.smembers(key, (error, reply) => {
        if (error) {
          return reject(error);
        }

        return resolve(reply && reply !== 'nil' ? reply : defaultValue);
      });
    });

    return response;
  } catch (e) {
    return false;
  }
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
