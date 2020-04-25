import * as amqplib from 'amqplib';
import * as dotenv from 'dotenv';
import { RABBITMQ_QUEUES } from '../data/constants';
import { debugWorkers } from '../debuggers';
import { receiveImportCancel, receiveImportRemove, receiveImportXls } from './utils';

dotenv.config();

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;

let connection;
let channel;

export const initConsumer = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_HOST);
    channel = await connection.createChannel();

    await channel.assertQueue(RABBITMQ_QUEUES.WORKERS);

    channel.consume(RABBITMQ_QUEUES.WORKERS, async msg => {
      if (msg !== null) {
        debugWorkers(`Received queue message ${msg.content.toString()}`);

        const content = JSON.parse(msg.content.toString());

        if (content.type === 'cancelImport') {
          receiveImportCancel();
        }

        channel.ack(msg);
      }
    });

    await channel.assertQueue(RABBITMQ_QUEUES.RPC_API_TO_WORKERS);

    channel.consume(RABBITMQ_QUEUES.RPC_API_TO_WORKERS, async msg => {
      if (msg !== null) {
        debugWorkers(`Received rpc queue message ${msg.content.toString()}`);

        const content = JSON.parse(msg.content.toString());

        const response = { status: 'success', data: {}, errorMessage: '' };

        try {
          response.data =
            content.action === 'removeImport' ? await receiveImportRemove(content) : await receiveImportXls(content);
        } catch (e) {
          response.status = 'error';
          response.errorMessage = e.message;
        }

        channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
          correlationId: msg.properties.correlationId,
        });

        channel.ack(msg);
      }
    });
  } catch (e) {
    console.log(e.message);
  }
};
