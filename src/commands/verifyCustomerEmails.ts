import * as amqplib from 'amqplib';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;
let connection;
let channel;

connect().then(async () => {
  const exit = async msg => {
    console.log('exit');
    channel.ack(msg);

    disconnect();

    process.exit();
  };

  const verify = async () => {
    console.log(
      'Instruction: yarn verifyCustomerEmails emailVerifierType. emailVerifierType`s default value is truemail',
    );

    const customers = await Customers.find(
      { primaryEmail: { $exists: true, $ne: null }, hasValidEmail: { $exists: false } },
      { primaryEmail: 1 },
    );

    const argv = process.argv;

    const type = argv.length === 3 ? argv[2] : 'truemail';

    const emails = customers.map(customer => customer.primaryEmail);

    const firstEmails = [emails[11], emails[12]];

    const data = {
      type,
      emails: firstEmails,
    };

    await channel.assertQueue('erxes-api:email-verifier-bulk');
    await channel.sendToQueue('erxes-api:email-verifier-bulk', Buffer.from(JSON.stringify(data)));
  };

  const initConsumer = async () => {
    connection = await amqplib.connect(RABBITMQ_HOST);
    channel = await connection.createChannel();

    // listen for engage api ===========
    await channel.assertQueue('engages-api:email-verifier-bulk');

    channel.consume('engages-api:email-verifier-bulk', async msg => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());

        console.log('data: ', data);

        if (data.status === 'success') {
          if (data.verifiedEmails && data.verifiedEmails.length > 0) {
            for (const row of data.verifiedEmails) {
              const customer = await Customers.findOne({ primaryEmail: row.email });

              if (customer) {
                customer.hasValidEmail = row.status === 'valid';

                await customer.save();
              }
            }

            await exit(msg);
          } else {
            await exit(msg);
          }
        } else {
          if (data.status === 'error') {
            console.log(data.message);
          }

          await exit(msg);
        }
      } else {
        await exit(msg);
      }
    });

    verify();
  };

  initConsumer();
});
