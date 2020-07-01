import * as csv from 'csv-writer';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as request from 'request-promise';
import { sendMessage } from './messageBroker';
import { PHONE_VALIDATION_STATUSES, Phones } from './models';
import { getArray, setArray } from './redisClient';
import { debugBase, getEnv, sendRequest } from './utils';
dotenv.config();

const CLEAR_OUT_PHONE_API_KEY = getEnv({ name: 'CLEAR_OUT_PHONE_API_KEY' });

const sendSingleMessage = async (
  doc: {
    phone: string;
    status: string;
    lineType?: string;
    carrier?: string;
    internationalFormat?: string;
    localFormat?: string;
  },
  isRest: boolean,
  create?: boolean,
) => {
  if (create) {
    if (doc.lineType === 'mobile') {
      doc.status = PHONE_VALIDATION_STATUSES.RECEIVES_SMS;
    }
    await Phones.createPhone(doc);
  }

  if (isRest) {
    return doc;
  }

  return sendMessage('phoneVerifierNotification', { action: 'phoneVerify', data: [doc] });
};

const singleClearOut = async (phone: string): Promise<any> => {
  try {
    return sendRequest({
      url: 'https://api.clearoutphone.io/v1/phonenumber/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
      },
      body: { number: phone },
    });
  } catch (e) {
    debugBase(`Error occured during single phone validation ${e.message}`);
    throw e;
  }
};

const bulkClearOut = async (unverifiedPhones: string[]) => {
  for (let index = 0; index < unverifiedPhones.length; index += 1000) {
    const junk = unverifiedPhones.slice(index, index + 1000);

    const fileName =
      Math.random()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15);

    const csvWriter = csv.createObjectCsvWriter({
      path: `./${fileName}.csv`,
      header: [{ id: 'number', title: 'Phone' }],
    });

    await csvWriter.writeRecords(junk.map(phone => ({ number: phone })));

    try {
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });

      await sendFile(fileName);
    } catch (e) {
      debugBase(`Error occured during bulk phone validation ${e.message}`);
      sendMessage('phoneVerifierBulkPhoneNotification', { action: 'bulk', data: e.message });
    }
  }
};

export const sendFile = async (fileName: string) => {
  try {
    const result = await request({
      method: 'POST',
      url: 'https://api.clearoutphone.io/v1/phonenumber/bulk',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
      },
      formData: {
        file: fs.createReadStream(`./${fileName}.csv`),
      },
    });

    const { data, error } = JSON.parse(result);

    if (data) {
      const listIds = await getArray('erxes_phone_verifier_list_ids');

      listIds.push(data.list_id);

      setArray('erxes_phone_verifier_list_ids', listIds);

      await fs.unlinkSync(`./${fileName}.csv`);
    } else if (error) {
      throw new Error(error.message);
    }
  } catch (e) {
    // request may fail
    throw e;
  }
};

export const getStatus = async (listId: string) => {
  const url = `https://api.clearoutphone.io/v1/phonenumber/bulk/progress_status?list_id=${listId}`;
  try {
    const result = await request({
      method: 'GET',
      url,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
      },
    });

    return JSON.parse(result);
  } catch (e) {
    throw e;
  }
};

export const validateSinglePhone = async (phone: string, isRest = false) => {
  const phoneOnDb = await Phones.findOne({ phone }).lean();

  if (phoneOnDb) {
    return sendSingleMessage(
      {
        phone,
        status: phoneOnDb.status,
        carrier: phoneOnDb.carrier,
        lineType: phoneOnDb.lineType,
        localFormat: phoneOnDb.localFormat,
      },
      isRest,
    );
  }

  if (!phone.includes('+')) {
    debugBase('Phone number must include country code for verification!');
    throw new Error('Phone number must include country code for verification!');
  }

  let response: { status?: string; data?: any } = {};

  try {
    response = await singleClearOut(phone);
  } catch (e) {
    return sendSingleMessage({ phone, status: PHONE_VALIDATION_STATUSES.UNKNOWN }, isRest);
  }

  if (response.status === 'success') {
    const data = response.data;

    return sendSingleMessage(
      {
        phone,
        status: data.status,
        lineType: data.line_type,
        carrier: data.carrier,
        internationalFormat: data.international_format,
        localFormat: data.local_format,
      },
      isRest,
      true,
    );
  }

  return sendSingleMessage({ phone, status: PHONE_VALIDATION_STATUSES.INVALID }, isRest);
};

export const validateBulkPhones = async (phones: string[]) => {
  const phonesOnDb = await Phones.find({ phone: { $in: phones } });

  const phonesMap: Array<{ phone: string; status: string }> = phonesOnDb.map(({ phone, status }) => ({
    phone,
    status,
  }));

  const verifiedPhones = phonesMap.map(verified => ({ phone: verified.phone, status: verified.status }));

  const unverifiedPhones: string[] = phones.filter(phone => !verifiedPhones.some(p => p.phone === phone));

  if (verifiedPhones.length > 0) {
    sendMessage('phoneVerifierNotification', { action: 'phoneVerify', data: verifiedPhones });
  }

  if (unverifiedPhones.length > 0) {
    return bulkClearOut(unverifiedPhones);
  }

  return sendMessage('phoneVerifierBulkNotification', {
    action: 'bulk',
    data: 'There are no phones to verify on the phone verification system',
  });
};

export const getBulkResult = async (listId: string) => {
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
      const resp = await sendRequest({
        url: response.data.url,
        method: 'GET',
      });

      const rows = resp.split('\n');
      const phones: Array<{ phone: string; status: string }> = [];

      for (const [index, row] of rows.entries()) {
        if (index !== 0) {
          const rowArray = row.split(',');

          if (rowArray.length > 12) {
            const phone = rowArray[0];
            const status = rowArray[1].toLowerCase();
            const lineType = rowArray[2];
            const carrier = rowArray[3];
            const internationalFormat = rowArray[8];
            const localFormat = rowArray[9];

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
                lineType,
                carrier,
                internationalFormat,
                localFormat,
              };

              await Phones.create(doc);
            }
          }
        }
      }

      sendMessage('phoneVerifierNotification', { action: 'phoneVerify', data: phones });
    } catch (e) {
      throw e;
    }
  } catch (e) {
    throw e;
  }
};
