import * as amqplib from 'amqplib';
import * as cote from 'cote';
import * as dotenv from 'dotenv';
import { RABBITMQ_QUEUES } from '../data/constants';
import { debugWorkers } from '../debuggers';
import { receiveImportCancel, receiveImportCreate, receiveImportRemove } from './utils';

dotenv.config();

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;

let responder;
let connection;
let channel;

export const initConsumer = async () => {
  responder = new cote.Responder({
    name: 'workersResponder',
  });

  responder.on('rpc_queue:api_to_workers', async (req, cb) => {
    const response = await receiveImportRemove(JSON.parse(req.message));

    cb(null, response);
  });

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
        const response = { status: 'success', data: {}, errorMessage: '' };

        debugWorkers(`Received rpc queue message ${msg.content.toString()}`);

        const content = JSON.parse(msg.content.toString());

        try {
          response.data =
            content.action === 'removeImport' ? await receiveImportRemove(content) : await receiveImportCreate(content);
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
