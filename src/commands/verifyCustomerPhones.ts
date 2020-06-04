import * as amqplib from 'amqplib';
import { validatePhone } from '../data/utils';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;

const main = async () => {
  const connection = await amqplib.connect(RABBITMQ_HOST);
  const channel = await connection.createChannel();

  connect().then(async () => {
    const verify = async () => {
      const argv = process.argv;
      const useRest = argv.length > 2;

      const query = { primaryPhone: { $exists: true, $ne: null }, phoneValidationStatus: { $exists: false } };
      const customers = await Customers.find(query, { primaryPhone: 1 });
      const phones = customers.map(customer => customer.primaryPhone);

      if (useRest) {
        for (const phone of phones) {
          console.log('Validating .....', phone);
          await validatePhone(phone || '', true);
        }

        process.exit();
      }

      const args = {
        action: 'phoneVerify',
        data: { phones },
      };

      console.log('bulk phones: ', phones);

      await channel.assertQueue('erxes-api:email-verifier-notification');
      await channel.sendToQueue('erxes-api:email-verifier-notification', Buffer.from(JSON.stringify(args)));
    };

    await verify();

    await channel.assertQueue('phoneVerifierBulkNotification');

    channel.consume('phoneVerifierBulkNotification', async msg => {
      if (msg !== null) {
        console.log('Bulk status: ', JSON.parse(msg.content.toString()));

        channel.ack(msg);

        setTimeout(() => {
          connection.close();

          disconnect();

          process.exit();
        }, 500);
      }
    });
  });
};

main()
  .then(() => {
    console.log('success ...');
  })
  .catch(e => {
    console.log(e.message);
  });
