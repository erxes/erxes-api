import { debugBase } from './debuggers';
import { client } from './elasticsearch';

export const saveEvent = (args: { type: string; name: string; customerId: string; attributes: any }) => {
  const { type, name, customerId, attributes } = args;

  if (!type) {
    throw new Error('Type is required');
  }

  if (!name) {
    throw new Error('Name is required');
  }

  if (!customerId) {
    throw new Error('Customer id is required');
  }

  client.index(
    {
      index: 'events',
      body: {
        type,
        name,
        customerId,
        createdAt: new Date(),
        attributes: attributes || {},
      },
    },

    (err, resp, status) => {
      if (err) {
        return debugBase(`Error during event save ${err}`);
      }

      return debugBase(`Succesfully saved event ${JSON.stringify(resp)} ${status}`);
    },
  );
};

export const trackViewPageEvent = (args: { customerId: string; url: string }) => {
  return saveEvent({
    type: 'lifeCycle',
    name: 'viewPage',
    customerId: args.customerId,
    attributes: {
      url: args.url,
    },
  });
};

export const trackCustomEvent = (args: { name: string; customerId: string; attributes: any }) => {
  return saveEvent({
    type: 'custom',
    name: args.name,
    customerId: args.customerId,
    attributes: args.attributes,
  });
};
