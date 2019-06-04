import { withFilter } from 'apollo-server-express';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { graphqlPubsub } from '../../../pubsub';

export const subscriptionWrapper = (name: string) => ({
  subscribe: () => (graphqlPubsub as any).asyncIterator(name),
});

export const subscriptionWrapperWithFilter = (
  name: string,
  callback: (
    message: IMessageDocument,
    variables: { _id?: string; customerId?: string; userId?: string },
  ) => Promise<boolean> | boolean,
) => ({
  subscribe: withFilter(
    () => (graphqlPubsub as any).asyncIterator(name),
    (payload, variables) => callback(payload[name], variables),
  ),
});

export const convertPubSubBuffer = (data: Buffer) => {
  return JSON.parse(data.toString());
};
