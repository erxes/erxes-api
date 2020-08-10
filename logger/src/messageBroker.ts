import * as dotenv from 'dotenv';
import init from './messageBroker/index';
import { receivePutLogCommand } from './utils';

dotenv.config();

let client;

export const initBroker = async () => {
  client = await init({ name: 'logger', RABBITMQ_HOST: process.env.RABBITMQ_HOST });

  const { consumeQueue } = client;

  consumeQueue('putLog', async data => {
    await receivePutLogCommand(data);
  });
};

export default client;
