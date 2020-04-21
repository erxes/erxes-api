import * as amqplib from 'amqplib';
import * as dotenv from 'dotenv';
import { RABBITMQ_QUEUES } from '../data/constants';
import { receiveImportCancel, receiveImportRemove, receiveImportXls } from './utils';

dotenv.config();

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;

let connection;
let channel;

const init = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_HOST);
    channel = await connection.createChannel();

    // Remove import histories
    await channel.assertQueue(RABBITMQ_QUEUES.IMPORT_HISTORY_REMOVE);

    channel.consume(RABBITMQ_QUEUES.IMPORT_HISTORY_REMOVE, async msg => {
      if (msg !== null) {
        const content = msg.content.toString();

        await receiveImportRemove(content);

        channel.ack(msg);
      }
    });

    // Cancel import histories
    await channel.assertQueue(RABBITMQ_QUEUES.IMPORT_HISTORY_CANCEL);

    channel.consume(RABBITMQ_QUEUES.IMPORT_HISTORY_CANCEL, async msg => {
      if (msg !== null) {
        receiveImportCancel();

        channel.ack(msg);
      }
    });

    await channel.assertQueue(RABBITMQ_QUEUES.IMPORT_HISTORY_ADD);

    channel.consume(RABBITMQ_QUEUES.IMPORT_HISTORY_ADD, async msg => {
      if (msg !== null) {
        const content = msg.content.toString();
        const response: any = {};

        try {
          response.status = 'success';
          response.data = await receiveImportXls(content);
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

init();