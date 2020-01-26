import * as elasticsearch from 'elasticsearch';
import { debugBase } from './debuggers';

export const client = new elasticsearch.Client({
  hosts: ['http://localhost:9200/'],
});

export const fetchElk = async (action, index: string, body: any) => {
  try {
    const response = await client[action]({
      index,
      body,
    });

    return response;
  } catch (e) {
    debugBase(`Error during elk query ${e}`);
    throw new Error(e);
  }
};
