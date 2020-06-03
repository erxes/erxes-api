// import * as amqplib from 'amqplib';
import * as fs from 'fs';
import * as request from 'request-promise';
import * as xlsx from 'xlsx-populate';
import { connect, disconnect } from '../connection';
import { Phones } from '../models';

console.log('Instruction: yarn checkAndGetBulkPhones taskId');

// const { RABBITMQ_HOST = 'amqp://localhost', CLEAR_OUT_PHONE_API_KEY, PHONE_VERIFIER_ENDPOINT } = process.env;
const { CLEAR_OUT_PHONE_API_KEY, PHONE_VERIFIER_ENDPOINT } = process.env;
if (!CLEAR_OUT_PHONE_API_KEY || !PHONE_VERIFIER_ENDPOINT) {
  console.log('Please configure CLEAROUTPHONE API KEY & ENDPOINT');

  disconnect();
  process.exit();
}

connect().then(async () => {
  // const getClearOutPhoneBulk = async (filePath:string) => {
  //   const connection = await amqplib.connect(RABBITMQ_HOST);
  //   console.log('connection:',connection.domain);
  // //   const channel = await connection.createChannel();

  // };

  const check = async () => {
    const argv = process.argv;

    if (argv.length < 3) {
      console.log('Please put taskId after yarn checkAndGetBulkEmails');

      disconnect();
      process.exit();
    }

    const unverifiedPhones: any[] = [];
    const verifiedPhones: any[] = [];

    try {
      const workbook = await xlsx.fromFileAsync(
        '/Users/soyombobat-erdene/backend/erxes_op/erxes-api/email-verifier/src/testContacts.xlsx',
      );
      const columnIndex = workbook.find('phone')[0]._columnNumber - 1;
      const values = workbook
        .sheet(0)
        .usedRange()
        .value();

      // tslint:disable-next-line:no-shadowed-variable
      for (const { index, value } of values.map((value: any, index: any) => ({ index, value }))) {
        if (index !== 0) {
          const phone = value[columnIndex];

          const found = await Phones.findOne({ phone });

          if (found) {
            verifiedPhones.push({ phone: found.phone, status: found.status });
          } else {
            unverifiedPhones.push({ phone });
          }
        }
      }

      if (verifiedPhones.length > 0) {
        console.log('Verified phones: ', verifiedPhones);
      }

      if (unverifiedPhones.length > 0) {
        const workbookToWrite = await xlsx.fromBlankAsync();
        workbookToWrite
          .sheet(0)
          .cell('A1')
          .value('phone');
        // tslint:disable-next-line:no-shadowed-variable
        for (const { i, val } of unverifiedPhones.map((val: any, i: any) => ({ i, val }))) {
          const cellNumber = 'A'.concat((i + 2).toString());
          workbookToWrite
            .sheet(0)
            .cell(cellNumber)
            .value(val.phone);
        }
        try {
          await workbookToWrite.toFileAsync(
            '/Users/soyombobat-erdene/backend/erxes_op/erxes-api/email-verifier/src/unverified.xlsx',
          );
          try {
            const options = {
              method: 'POST',
              url: `${PHONE_VERIFIER_ENDPOINT}/bulk`,
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
              },
              formData: {
                file: fs.createReadStream(
                  '/Users/soyombobat-erdene/backend/erxes_op/erxes-api/email-verifier/src/unverified.xlsx',
                ),
              },
            };
            const rs = await request(options);
            console.log('rs:', rs);
          } catch (e) {
            console.log(`Error occured during bulk phone validation ${e.message}`);
          }
        } catch (e) {
          console.log('failed to create xlsl: ', e.message);
        }
      } else {
        console.log('All phones verified');
      }
    } catch (e) {
      console.log('file error:', e.message);
    }

    const taskId = argv[2];

    console.log(taskId);
  };

  await check();
});
