import * as cote from 'cote';
import { debugBase } from './debuggers';

let publisher;
let requester;
let subscriber;

export const consumeQueue = async (queueName, callback) => {
  subscriber.on(queueName, async req => {
    await callback(JSON.parse(req));
  });
};

export const consumeRPCQueue = consumeQueue;

export const sendRPCMessage = async (queueName: string, message: any): Promise<any> => {
  debugBase(`Sending rpc message ${JSON.stringify(message)} to queue ${queueName}`);

  const response = await requester.send({
    type: queueName,
    message: JSON.stringify(message),
  });

  return response;
};

export const sendMessage = async (queueName: string, data?: any) => {
  debugBase(`Sending message to ${queueName}`);

  publisher.publish(queueName, Buffer.from(JSON.stringify(data || {})));
};

interface IInit {
  name: string;
  hasPublisher?: boolean;
  hasRequester?: boolean;
  hasSubscriber?: boolean;
}

export const init = async ({ name, hasPublisher, hasRequester, hasSubscriber }: IInit) => {
  if (hasPublisher) {
    publisher = new cote.Publisher({ name: `${name}Publisher` });
  }

  if (hasRequester) {
    requester = new cote.Requester({ name: `${name}Requester` });
  }

  if (hasSubscriber) {
    subscriber = new cote.Subscriber({ name: `${name}Subscriber` });
  }
};
