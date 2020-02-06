import { Customers } from './db/models';
import { debugBase } from './debuggers';
import { client } from './elasticsearch';

export const saveEvent = async (args: { type?: string; name?: string; customerId?: string; attributes?: any }) => {
  const { type, name, attributes } = args;

  if (!type) {
    throw new Error('Type is required');
  }

  if (!name) {
    throw new Error('Name is required');
  }

  let customerId = args.customerId;

  if (!customerId) {
    customerId = await Customers.createVisitor();
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

  return { customerId };
};

export const trackViewPageEvent = (args: { customerId: string; attributes: any }) => {
  return saveEvent({
    type: 'lifeCycle',
    name: 'viewPage',
    customerId: args.customerId,
    attributes: args.attributes,
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

export const identifyCustomer = async (args: { email?: string; phone?: string; code?: string }) => {
  // get or create customer
  let customer = await Customers.getWidgetCustomer(args);

  if (!customer) {
    customer = await Customers.createCustomer({
      primaryEmail: args.email,
      code: args.code,
      primaryPhone: args.phone,
    });
  }

  return { customerId: customer._id };
};

export const updateCustomerProperty = async ({
  customerId,
  name,
  value,
}: {
  customerId: string;
  name: string;
  value: any;
}) => {
  if (!customerId) {
    throw new Error('Customer id is required');
  }

  await Customers.updateOne({ _id: customerId }, { $set: { [name]: value } });

  return { status: 'ok' };
};
