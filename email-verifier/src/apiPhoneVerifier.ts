import { sendMessage } from './messageBroker';
import { PHONE_VALIDATION_STATUSES, Phones } from './models';
import { debugBase, sendRequest } from './utils';

const { CLEAR_OUT_PHONE_API_KEY, PHONE_VERIFIER_ENDPOINT } = process.env;

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
    if (doc.internationalFormat) {
      doc.phone = doc.internationalFormat;
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
    const url = `${PHONE_VERIFIER_ENDPOINT}/validate`;
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
  console.log(unverifiedPhones);
};

export const single = async (phone: string, isRest = false) => {
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

  // if status is not success

  return sendSingleMessage({ phone, status: PHONE_VALIDATION_STATUSES.INVALID }, isRest);
};

export const bulk = async (phones: string[]) => {
  const unverifiedPhones: any[] = [];
  const verifiedPhones: any[] = [];

  for (const phone of phones) {
    const found = await Phones.findOne({ phone });

    if (found) {
      verifiedPhones.push({ phone: found.phone, status: found.status });
    } else {
      unverifiedPhones.push({ phone });
    }
  }

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
