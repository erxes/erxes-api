import * as elasticsearch from 'elasticsearch';
import { debugBase } from './debuggers';

export const client = new elasticsearch.Client({
  hosts: ['http://localhost:9200/'],
});

export const performCount = async (index: string, query: any) => {
  try {
    const response = await client.count({
      index,
      body: {
        query,
      },
    });

    return response.count;
  } catch (e) {
    debugBase(`Error during elk query ${e}`);
    throw new Error(e);
  }
};

export const saveEvent = event => {
  client.index(
    {
      index: 'events',
      body: event,
    },

    (err, resp, status) => {
      if (err) {
        return debugBase(`Error during event save ${err}`);
      }

      return debugBase(`Succesfully saved event ${JSON.stringify(resp)} ${status}`);
    },
  );
};
