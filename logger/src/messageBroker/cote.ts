import * as cote from 'cote';
import { debugBase } from './debuggers';

let publisher;
let subscriber;

let name;

const requesters = {};
const responders = {};

export const consumeQueue = async (queueName, callback) => {
  if (!subscriber) {
    subscriber = new cote.Subscriber({ name: `${name}Subscriber` });
  }

  subscriber.on(queueName, async req => {
    await callback(JSON.parse(req));
  });
};

export const sendRPCMessage = async (queueName: string, message: any): Promise<any> => {
  if (!requesters[queueName]) {
    requesters[queueName] = new cote.Requester({ name: `${queueName} requester`, key: queueName });
  }

  debugBase(`Sending rpc message ${JSON.stringify(message)} to queue ${queueName}`);

  const response = await requesters[queueName].send({
    type: queueName,
    message: JSON.stringify(message),
  });

  if (response.status === 'success') {
    return response.data;
  } else {
    throw new Error(response.errorMessage);
  }
};

export const consumeRPCQueue = async (queueName, callback) => {
  if (!responders[queueName]) {
    responders[queueName] = new cote.Responder({ name: `${queueName} responder`, key: queueName });
  }

  responders[queueName].on(queueName, async (req, cb) => {
    const response = await callback(JSON.parse(req.message));

    cb(null, response);
  });
};

export const sendMessage = async (queueName: string, data?: any) => {
  debugBase(`Sending message to ${queueName}`);

  if (!publisher) {
    publisher = new cote.Publisher({ name: `${name}Publisher` });
  }

  publisher.publish(queueName, Buffer.from(JSON.stringify(data || {})));
};

export const init = async options => {
  name = options.name;
};
