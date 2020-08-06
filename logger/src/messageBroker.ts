import * as amqplib from 'amqplib';
import * as cote from 'cote';
import * as dotenv from 'dotenv';
import { debugBase } from './debuggers';
import { receivePutLogCommand } from './utils';

dotenv.config();

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;

let connection;
let channel;
let subscriber;

const init = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_HOST);
    channel = await connection.createChannel();

    // main api =========
    await channel.assertQueue('putLog');

    channel.consume('putLog', async msg => {
      if (msg !== null) {
        // const content = msg.content.toString();

        // await receivePutLogCommand(JSON.parse(content));

        channel.ack(msg);
      }
    });

    subscriber = new cote.Subscriber({
      name: 'loggerSubscriber',
    });

    subscriber.on('putLog', async req => {
      await receivePutLogCommand(JSON.parse(req));
    });
  } catch (e) {
    debugBase(e.message);
  }
};

init();
