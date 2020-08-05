const storage = {};

/*
 * Get item
 */
export const get = (key: string, defaultValue?: any): Promise<any> => {
  return new Promise(resolve => {
    const value = storage[key];

    return resolve(value || defaultValue);
  });
};

/*
 * Set item
 */
export const set = (key: string, value: any) => {
  storage[key] = value;
};

/*
 * Check if value exists in set
 */
export const inArray = async (setKey: string, setMember: string): Promise<any> => {
  const value = storage[setKey];

  if (!value) {
    return false;
  }

  return value.includes(setMember);
};

/*
 * Add a value to a set or do nothing if it already exists
 */
export const addToArray = (setKey: string, setMember: string) => {
  const value = storage[setKey];

  if (value) {
    value.push(setMember);
  }
};

/*
 * Remove a value from a set or do nothing if it is not present
 */
export const removeFromArray = (setKey: string, setMember: string) => {
  const value = storage[setKey];

  if (value) {
    value.filter(m => m !== setMember);
  }
};
