import * as amqplib from 'amqplib';
import * as csv from 'csvtojson';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { connect, disconnect } from '../connection';
import { Phones } from '../models';
import { sendRequest } from '../utils';

console.log('Instruction: yarn checkAndGetBulkPhones list_id');

const { RABBITMQ_HOST = 'amqp://localhost', CLEAR_OUT_PHONE_API_KEY } = process.env;

if (!CLEAR_OUT_PHONE_API_KEY) {
  console.log('Please configure CLEAROUTPHONE API KEY');

  disconnect();
  process.exit();
}

connect().then(async () => {
  const getClearOutPhoneBulk = async (listId: string) => {
    const connection = await amqplib.connect(RABBITMQ_HOST);

    const channel = await connection.createChannel();

    const url = 'https://api.clearoutphone.io/v1/download/result';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
    };

    try {
      const response = await sendRequest({
        url,
        method: 'POST',
        headers,
        body: { list_id: listId },
      });

      try {
        await downloadResult(response.data.url);
        const jsonArray = await csv().fromFile('./verified.csv');
        const phones: Array<{ phone: string; status: string }> = [];
        for (const obj of jsonArray) {
          const phone = obj['Phone Number'];
          const status = obj['ClearoutPhone Validation Status'].toLowerCase();

          phones.push({
            phone,
            status,
          });

          const found = await Phones.findOne({ phone });
          if (!found) {
            const doc = {
              phone,
              status,
              created: new Date(),
              lineType: obj['ClearoutPhone Line Type'],
              carrier: obj['ClearoutPhone Carrier'],
              internationalFormat: obj['ClearoutPhone International Format'],
              localFormat: obj['ClearoutPhone Local Format'],
            };
            await Phones.create(doc);
          }
        }

        const args = { action: 'phoneVerify', data: phones };

        await channel.assertQueue('phoneVerifierNotification');
        await channel.sendToQueue('phoneVerifierNotification', Buffer.from(JSON.stringify(args)));

        console.log('Successfully get the following phones : \n', phones);
      } catch (e) {
        console.log('An error occured while downloading result ', e.message);
      }
    } catch (e) {
      console.log('An error occured: ', e.message);
    }

    setTimeout(() => {
      channel.connection.close();

      disconnect();
      process.exit();
    }, 500);
  };

  const downloadResult = async (url: string) => {
    const proto = !url.charAt(4).localeCompare('s') ? https : http;

    return new Promise((resolve, reject) => {
      const filePath = './verified.csv';
      const file = fs.createWriteStream(filePath);
      let fileInfo = null;

      const request = proto.get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }

        fileInfo = {
          mime: response.headers['content-type'],
          size: parseInt(response.headers['content-length'], 10),
        };

        response.pipe(file);
      });

      // The destination stream is ended by the time it's called
      file.on('finish', () => resolve(fileInfo));

      request.on('error', err => {
        fs.unlink(filePath, () => reject(err));
      });

      file.on('error', err => {
        fs.unlink(filePath, () => reject(err));
      });

      request.end();
    });
  };

  const check = async () => {
    const argv = process.argv;

    if (argv.length < 3) {
      console.log('Please put listId after yarn checkAndGetBulkPhones');

      disconnect();
      process.exit();
    }

    const listId = argv[2];
    const url = `https://api.clearoutphone.io/bulk/progress_status?list_id=${listId}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
    };
    const response = await sendRequest({
      url,
      method: 'GET',
      headers,
    });

    if (response.data.progress_status === 'completed') {
      await getClearOutPhoneBulk(listId);
    } else {
      disconnect();
      process.exit();
    }
  };

  await check();
});
