import * as redisClient from './redisClient';

/*
 * Get item
 */
export const get = (key: string, defaultValue?: any): Promise<any> => {
  return redisClient.get(key, defaultValue);
};

/*
 * Set item
 */
export const set = (key: string, value: any) => {
  return redisClient.set(key, value);
};

export const getArray = async (key: string, defaultValue = []): Promise<any> => {
  return redisClient.set(key, defaultValue);
};

/*
 * Check if value exists in set
 */
export const inArray = async (setKey: string, setMember: string): Promise<any> => {
  return redisClient.inArray(setKey, setMember);
};

/*
 * Add a value to a set or do nothing if it already exists
 */
export const addToArray = (setKey: string, setMember: string) => {
  return redisClient.addToArray(setKey, setMember);
};

/*
 * Remove a value from a set or do nothing if it is not present
 */
export const removeFromArray = (setKey: string, setMember: string) => {
  return redisClient.removeFromArray(setKey, setMember);
};
