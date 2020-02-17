import * as amqplib from 'amqplib';

const { RABBITMQ_HOST = 'amqp://localhost' } = process.env;
let connection;
let channel;

const checkStatus = async () => {
  const argv = process.argv;

  if (argv.length < 3) {
    console.log('Please put taskId after yarn checkStatusEmailVerifier');

    process.exit();
  }

  const taskId = argv[2];
  const type = argv.length === 4 ? argv[3] : 'truemail';

  const data = {
    taskId,
    type,
  };

  await channel.assertQueue('erxes-api:email-verifier-status');
  await channel.sendToQueue('erxes-api:email-verifier-status', Buffer.from(JSON.stringify(data || {})));
};

const initConsumer = async () => {
  connection = await amqplib.connect(RABBITMQ_HOST);
  channel = await connection.createChannel();

  // listen for engage api ===========
  await channel.assertQueue('engages-api:email-verifier-status');

  channel.consume('engages-api:email-verifier-status', async msg => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());

      console.log('status: ', data);
    }

    process.exit();
  });

  checkStatus();
};

initConsumer();
