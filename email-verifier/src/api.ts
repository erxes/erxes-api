import * as EmailValidator from 'email-deep-validator';
import { sendMessage } from './messageBroker';
import { EMAIL_VALIDATION_STATUSES, Emails } from './models';
import { getArray, setArray } from './redisClient';
import { debugBase, sendRequest } from './utils';

const { TRUE_MAIL_API_KEY, EMAIL_VERIFICATION_TYPE = 'truemail' } = process.env;

const sendSingleMessage = async (doc: { email: string; status: string }, isRest: boolean, create?: boolean) => {
  if (create) {
    await Emails.createEmail(doc);
  }

  if (isRest) {
    return doc.status;
  }

  return sendMessage('emailVerifierNotification', { action: 'emailVerify', data: [doc] });
};

const singleTrueMail = async (email: string) => {
  try {
    const url = `https://truemail.io/api/v1/verify/single?access_token=${TRUE_MAIL_API_KEY}&email=${email}`;

    const response = await sendRequest({
      url,
      method: 'GET',
    });

    return JSON.parse(response);
  } catch (e) {
    debugBase(`Error occured during single true mail validation ${e.message}`);
    throw e;
  }
};

const bulkTrueMail = async (unverifiedEmails: string[]) => {
  const url = `https://truemail.io/api/v1/tasks/bulk?access_token=${TRUE_MAIL_API_KEY}`;

  for (let index = 0; index < unverifiedEmails.length; index += 1000) {
    const junk = unverifiedEmails.slice(index, index + 1000).map(email => ({ email }));

    try {
      const result = await sendRequest({
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: {
          file: junk,
        },
      });

      const { data, error } = JSON.parse(result);

      if (data) {
        const taskIds = await getArray('erxes_email_verifier_task_ids');

        taskIds.push(data.task_id);

        setArray('erxes_email_verifier_task_ids', taskIds);
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      sendMessage('emailVerifierBulkEmailNotification', { action: 'bulk', data: e.message });
    }
  }
};

export const single = async (email: string, isRest = false) => {
  const emailOnDb = await Emails.findOne({ email });

  if (emailOnDb) {
    return sendSingleMessage({ email, status: emailOnDb.status }, isRest);
  }

  const emailValidator = new EmailValidator();
  const { validDomain, validMailbox } = await emailValidator.verify(email);

  if (validDomain && validMailbox) {
    return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.VALID }, isRest, true);
  }

  let response: { status?: string; result?: string } = {};

  if (EMAIL_VERIFICATION_TYPE === 'truemail') {
    try {
      response = await singleTrueMail(email);
    } catch (_e) {
      return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.UNKNOWN }, isRest);
    }
  }

  if (response.status === 'success') {
    return sendSingleMessage({ email, status: response.result }, isRest, true);
  }

  // if status is not success
  return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.INVALID }, isRest);
};

export const bulk = async (emails: string[]) => {
  const emailsOnDb = await Emails.find({ email: { $in: emails } });

  const emailsMap: Array<{ email: string; status: string }> = emailsOnDb.map(({ email, status }) => ({
    email,
    status,
  }));

  const verifiedEmails = emailsMap.map(verified => ({ email: verified.email, status: verified.status }));

  const unverifiedEmails = emails.filter(email => !verifiedEmails.some(e => e.email === email));

  if (verifiedEmails.length > 0) {
    sendMessage('emailVerifierNotification', { action: 'emailVerify', data: verifiedEmails });
  }

  if (unverifiedEmails.length > 0) {
    return bulkTrueMail(unverifiedEmails);
  }

  return sendMessage('emailVerifierBulkNotification', {
    action: 'bulk',
    data: 'There are no emails to verify on the email verification system',
  });
};

export const checkTask = async (taskId: string) => {
  const url = `https://truemail.io/api/v1/tasks/${taskId}/status?access_token=${TRUE_MAIL_API_KEY}`;

  const response = await sendRequest({
    url,
    method: 'GET',
  });

  return JSON.parse(response).data;
};

export const getTrueMailBulk = async taskId => {
  const url = `https://truemail.io/api/v1/tasks/${taskId}/download?access_token=${TRUE_MAIL_API_KEY}&timeout=30000`;

  const response = await sendRequest({
    url,
    method: 'GET',
  });

  const rows = response.split('\n');
  const emails: Array<{ email: string; status: string }> = [];

  for (const row of rows) {
    const rowArray = row.split(',');

    if (rowArray.length > 2) {
      const email = rowArray[0];
      const status = rowArray[2];

      emails.push({
        email,
        status,
      });

      const found = await Emails.findOne({ email });

      if (!found) {
        const doc = {
          email,
          status,
          created: new Date(),
        };

        await Emails.create(doc);
      }
    }
  }

  sendMessage('emailVerifierNotification', { action: 'emailVerify', data: emails });
};
