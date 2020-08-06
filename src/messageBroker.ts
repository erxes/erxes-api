import * as dotenv from 'dotenv';
import {
  receiveEngagesNotification,
  receiveIntegrationsNotification,
  receiveRpcMessage,
} from './data/modules/integrations/receiveMessage';
import { RobotEntries } from './db/models';
import { debugBase } from './debuggers';
import init from './messageBroker/index';
import { graphqlPubsub } from './pubsub';

dotenv.config();

let client;

export const initBroker = async () => {
  client = await init({ name: 'api', RABBITMQ_HOST: process.env.RABBITMQ_HOST });

  const { consumeQueue, consumeRPCQueue } = client;

  // listen for rpc queue =========
  consumeRPCQueue('rpc_queue:integrations_to_api', async data => receiveRpcMessage(data));

  // graphql subscriptions call =========
  consumeQueue('callPublish', params => {
    graphqlPubsub.publish(params.name, params.data);
  });

  consumeQueue('integrationsNotification', async data => {
    await receiveIntegrationsNotification(data);
  });

  consumeQueue('engagesNotification', async data => {
    await receiveEngagesNotification(data);
  });

  consumeQueue('sparkNotification', async data => {
    delete data.subdomain;

    RobotEntries.createEntry(data)
      .then(() => debugBase('success'))
      .catch(e => debugBase(e.message));
  });
};

export default client;
