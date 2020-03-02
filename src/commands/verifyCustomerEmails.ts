import * as amqplib from 'amqplib';
import { receiveEngagesNotification } from '../data/modules/integrations/receiveMessage';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost', DEFAULT_EMAIL_VERIFICATION_SERVICE = 'truemail' } = process.env;

connect().then(async () => {
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

  // listen for engage notification ===========
  await channel.assertQueue('engagesBulkEmailNotification');

  channel.consume('engagesBulkEmailNotification', async msg => {
    if (msg !== null) {
      await receiveEngagesNotification(JSON.parse(msg.content.toString()));

      channel.ack(msg);

      disconnect();

      process.exit();
    }
  });
});
