import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as request from 'request-promise';
import * as xlsx from 'xlsx-populate';
import { sendMessage } from './messageBroker';
import { PHONE_VALIDATION_STATUSES, Phones } from './models';
import { debugBase, getEnv, sendRequest } from './utils';

dotenv.config();

const CLEAR_OUT_PHONE_API_KEY = getEnv({ name: 'CLEAR_OUT_PHONE_API_KEY' });
const CLEAR_OUT_PHONE_ENDPOINT = getEnv({ name: 'CLEAR_OUT_PHONE_ENDPOINT' });

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

const singleClearOut = async (phone: string) => {
  const body = { number: phone };

  try {
    const url = `${CLEAR_OUT_PHONE_ENDPOINT}/validate`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
    };
    return await sendRequest({
      url,
      method: 'POST',
      headers,
      body,
    });
  } catch (e) {
    debugBase(`Error occured during single phone validation ${e.message}`);
    throw e;
  }
};

const bulkClearOut = async (unverifiedPhones: string[]) => {
  const workbook = await xlsx.fromBlankAsync();
  workbook
    .sheet(0)
    .cell('A1')
    .value('phone');

  for (const { i, val } of unverifiedPhones.map(() => ({ i, val }))) {
    const cellNumber = 'A'.concat((i + 2).toString());
    workbook
      .sheet(0)
      .cell(cellNumber)
      .value(val.phone);
  }

  try {
    await workbook.toFileAsync('./unverified.xlsx');
    try {
      const options = {
        method: 'POST',
        url: `${CLEAR_OUT_PHONE_ENDPOINT}/bulk`,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer:${CLEAR_OUT_PHONE_API_KEY}`,
        },
        formData: {
          file: fs.createReadStream('./unverified.xlsx'),
        },
      };
      const result = await request(options);

      sendMessage('phoneVerifierBulkPhoneNotification', { action: 'bulk', data: result });
    } catch (e) {
      debugBase(`Error occured during bulk phone validation ${e.message}`);
      sendMessage('phoneVerifierBulkPhoneNotification', { action: 'bulk', data: e.message });
    }
  } catch (e) {
    debugBase(`Failed to create xlsl ${e.message}`);
    sendMessage('phoneVerifierBulkPhoneNotification', { action: 'bulk', data: e.message });
  }
};

export const validateSinglePhone = async (phone: string, isRest = false) => {
  const phoneOnDb = await Phones.findOne({ phone });

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
  } catch (_e) {
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

  const verifiedPhones = await phonesOnDb.map(found => ({ phone: found.phone, status: found.status }));

  const tmp = await verifiedPhones.map(verified => verified.phone);

  const unverifiedPhones = phones.filter(phone => !tmp.includes(phone));

  if (verifiedPhones.length > 0) {
    sendMessage('phoneVerifierNotification', { action: 'phoneVerify', data: verifiedPhones });
  }

  if (unverifiedPhones.length > 0) {
    await bulkClearOut(unverifiedPhones);
  } else {
    sendMessage('phoneVerifierBulkNotification', {
      action: 'bulk',
      data: 'There are no phones to verify on the phone verification system',
    });
  }
};
