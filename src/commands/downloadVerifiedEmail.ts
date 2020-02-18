import * as amqplib from 'amqplib';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;
let connection;
let channel;

const download = async () => {
  console.log(
    'Instruction: yarn downloadVerifiedEmail taskId emailVerifierType. emailVerifierType`s default value is truemail',
  );
  const argv = process.argv;

  if (argv.length < 3) {
    console.log('Please put taskId after yarn downloadVerifiedEmail');

    process.exit();
  }

  const taskId = argv[2];
  const type = argv.length === 4 ? argv[3] : 'truemail';

  const data = {
    taskId,
    type,
  };

  await channel.assertQueue('erxes-api:email-verifier-download');
  await channel.sendToQueue('erxes-api:email-verifier-download', Buffer.from(JSON.stringify(data)));
};

const initConsumer = async () => {
  connection = await amqplib.connect(RABBITMQ_HOST);
  channel = await connection.createChannel();

  // listen for engage api ===========
  await channel.assertQueue('engages-api:email-verifier-download');

  channel.consume('engages-api:email-verifier-download', async msg => {
    if (msg !== null) {
      const response = JSON.parse(msg.content.toString());

      console.log('response: ', response);

      if (response.status === 'success') {
        const { emails } = response;

        if (emails && emails.length > 0) {
          connect()
            .then(async () => {
              for (const row of emails) {
                const customer = await Customers.findOne({ primaryEmail: row.email });

                if (customer) {
                  customer.hasValidEmail = row.status === 'valid';

                  await customer.save();
                }
              }
            })
            .then(() => {
              return disconnect();
            })
            .then(() => {
              channel.ack(msg);
              process.exit();
            });
        } else {
          channel.ack(msg);
          process.exit();
        }
      } else {
        if (response.status === 'error') {
          console.log(response.message);
        }

        channel.ack(msg);
        process.exit();
      }
    } else {
      channel.ack(msg);
      process.exit();
    }
  });

  download();
};

initConsumer();
