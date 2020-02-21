import * as amqplib from 'amqplib';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost', DEFAULT_EMAIL_VERIFICATION_SERVICE = 'truemail' } = process.env;

connect()
  .then(async () => {
    console.log('RABBITMQ_HOST: ', RABBITMQ_HOST);

    const connection = await amqplib.connect(RABBITMQ_HOST);
    const channel = await connection.createChannel();

    const verify = async () => {
      console.log(
        'Instruction: yarn verifyCustomerEmails emailVerifierType. emailVerifierType`s default value is truemail',
      );

      const customers = await Customers.find(
        { primaryEmail: { $exists: true, $ne: null }, hasValidEmail: { $exists: false } },
        { primaryEmail: 1 },
      );

      const argv = process.argv;

      const type = argv.length === 3 ? argv[2] : DEFAULT_EMAIL_VERIFICATION_SERVICE || '';

      const emails = customers.map(customer => customer.primaryEmail);

      const args = {
        action: 'verifyEmail',
        data: {
          type,
          emails: [emails[14], emails[15]],
        },
      };

      await channel.assertQueue('erxes-api:engages-notification');
      await channel.sendToQueue('erxes-api:engages-notification', Buffer.from(JSON.stringify(args)));
    };

    verify();
  })
  .then(() => {
    disconnect();

    process.exit();
  });
