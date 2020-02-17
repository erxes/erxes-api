import * as amqplib from 'amqplib';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;
let connection;
let channel;

const verify = () => {
  connect()
    .then(async () => {
      const customers = await Customers.find({ primaryEmail: { $exists: true, $ne: null } }, { primaryEmail: 1 });

      const emails = customers.map(customer => customer.primaryEmail);
      const firstEmail = [emails[3], emails[4]];

      await channel.assertQueue('erxes-api:email-verifier-bulk');
      await channel.sendToQueue('erxes-api:email-verifier-bulk', Buffer.from(JSON.stringify(firstEmail || [])));
    })

    .then(() => {
      return disconnect();
    })

    .then(() => {
      process.exit();
    });
};

const initConsumer = async () => {
  connection = await amqplib.connect(RABBITMQ_HOST);
  channel = await connection.createChannel();

  // listen for engage api ===========
  await channel.assertQueue('engages-api:email-verifier-bulk');

  channel.consume('engages-api:email-verifier-bulk', async msg => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());

      if (data.verifiedEmails && data.verifiedEmails.length > 0) {
        connect()
          .then(async () => {
            for (const row of data.verifiedEmails) {
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
      channel.ack(msg);
      process.exit();
    }
  });

  verify();
};

initConsumer();
