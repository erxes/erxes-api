import * as PubSub from '@google-cloud/pubsub';
import { google } from 'googleapis';
import * as request from 'request';
import { CONVERSATION_STATUSES } from '../data/constants';
import { ActivityLogs, ConversationMessages, Conversations, Customers, Integrations } from '../db/models';
import { IGmail as IMsgGmail } from '../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { getOauthClient } from './googleTracker';

interface IMailParams {
  integrationId: string;
  cocType: string;
  cocId: string;
  subject: string;
  body: string;
  toEmails: string;
  cc: string;
  bcc: string;
  attachments: string[];
}

/**
 * Get file by url into fileStream buffer
 */
const getInBufferAttachFile = (url: string) =>
  new Promise((resolve, reject) =>
    request.get({ url, encoding: null }, (error, response, body) => {
      if (error) {
        reject(error);
      }

      resolve({
        body,
        contentLength: response.headers['content-length'],
        contentType: response.headers['content-type'],
      });
    }),
  );

/**
 * Create string sequence that generates email body encrypted to base64
 */
const encodeEmail = async (
  toEmail: string,
  fromEmail: string,
  subject: string,
  body: string,
  attachments?: string[],
  ccEmails?: string,
  bccEmails?: string,
) => {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

  let rawEmail = [
    'Content-Type: multipart/mixed; boundary="erxes"',
    'MIME-Version: 1.0',
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    `Cc: ${ccEmails || ''}`,
    `Bcc: ${bccEmails || ''}`,
    `Subject: ${utf8Subject}`,
    '',
    '--erxes',
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
    '',
  ].join('\r\n');

  if (attachments) {
    for (const attachmentUrl of attachments) {
      const attach: any = await getInBufferAttachFile(attachmentUrl);
      const splitedUrl = attachmentUrl.split('/');
      const fileName = splitedUrl[splitedUrl.length - 1];

      rawEmail += [
        '--erxes',
        `Content-Type: ${attach.contentType}`,
        'MIME-Version: 1.0',
        `Content-Length: ${attach.contentLength}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${fileName}"`,
        '',
        attach.body.toString('base64'),
        '',
      ].join('\r\n');
    }
  }

  rawEmail += '--erxes--\r\n';

  return Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Send email & create activiy log with gmail kind
 */
export const sendGmail = async (mailParams: IMailParams, userId: string) => {
  const { integrationId, subject, body, toEmails, cc, bcc, attachments, cocType, cocId } = mailParams;

  const integration = await Integrations.findOne({ _id: integrationId });

  if (!integration || !integration.gmailData) {
    throw new Error(`Integration not found id with ${integrationId}`);
  }

  const fromEmail = integration.gmailData.email;

  const auth = getOauthClient('gmail');

  auth.setCredentials(integration.gmailData.credentials);

  const gmail: any = await google.gmail('v1');

  const raw = await encodeEmail(toEmails, fromEmail, subject, body, attachments, cc, bcc);

  const activityLogContent = JSON.stringify({
    toEmails,
    subject,
    body,
    attachments,
    cc,
    bcc,
  });

  return new Promise((resolve, reject) => {
    const data = {
      auth,
      userId: 'me',
      resource: {
        raw,
      },
    };

    gmail.users.messages.send(data, (err, response) => {
      if (err) {
        reject(err);
      }

      // Create activity log for send gmail
      ActivityLogs.createGmailLog(activityLogContent, cocType, cocId, userId);

      resolve(response);
    });
  });
};

/**
 * Get permission granted email information
 */
export const getGmailUserProfile = async (credentials): Promise<{ emailAddress?: string; historyId?: string }> => {
  const auth = getOauthClient('gmail');

  auth.setCredentials(credentials);

  const gmail: any = await google.gmail('v1');

  return new Promise((resolve, reject) => {
    gmail.users.getProfile({ auth, userId: 'me' }, (err, response) => {
      if (err) {
        reject(err);
      }

      resolve(response.data);
    });
  });
};

const indexHeaders = headers => {
  if (!headers) {
    return {};
  } else {
    return headers.reduce((result, header) => {
      result[header.name.toLowerCase()] = header.value;
      return result;
    }, {});
  }
};

const parseMessage = response => {
  const gmailData: {
    to: string;
    from: string;
    cc: string;
    bcc: string;
    subject: string;
    textHtml: string;
    textPlain: string;
    attachments: any;
  } = {
    to: '',
    from: '',
    cc: '',
    bcc: '',
    subject: '',
    textHtml: '',
    textPlain: '',
    attachments: [],
  };

  const payload = response.payload;
  if (!payload) {
    return gmailData;
  }

  let headers = indexHeaders(payload.headers);
  for (const headerKey of ['subject', 'from', 'to', 'cc', 'bcc']) {
    if (headers.hasOwnProperty(headerKey)) {
      gmailData[headerKey] = headers[headerKey];
    }
  }

  let parts = [payload];
  let firstPartProcessed = false;

  while (parts.length !== 0) {
    const part = parts.shift();
    if (part.parts) {
      parts = parts.concat(part.parts);
    }
    if (firstPartProcessed) {
      headers = indexHeaders(part.headers);
    }

    if (!part.body) {
      continue;
    }

    const isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
    const isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
    const isAttachment = headers['content-disposition'] && headers['content-disposition'].indexOf('attachment') !== -1;
    const isInline = headers['content-disposition'] && headers['content-disposition'].indexOf('inline') !== -1;

    if (isHtml && !isAttachment) {
      gmailData.textHtml = Buffer.from(part.body.data, 'base64').toString();
    } else if (isPlain && !isAttachment) {
      gmailData.textPlain = Buffer.from(part.body.data, 'base64').toString();
    } else if (isAttachment || isInline) {
      const body = part.body;
      gmailData.attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: body.size,
        attachmentId: body.attachmentId,
      });
    }

    firstPartProcessed = true;
  }

  return gmailData;
};

/**
 * Get gmail inbox updates
 */
export const getGmailUpdates = async ({ emailAddress, historyId }: { emailAddress: string; historyId: string }) => {
  const integration = await Integrations.findOne({
    gmailData: { $exists: true },
    'gmailData.email': emailAddress,
  });

  if (!integration || !integration.gmailData) {
    throw new Error('Integration not found');
  }

  const auth = getOauthClient('gmail');

  auth.setCredentials(integration.gmailData.credentials);

  const gmail: any = await google.gmail('v1');

  const response: any = await gmail.users.history.list({
    auth,
    userId: 'me',
    historyTypes: 'messageAdded',
    startHistoryId: integration.gmailData.historyId,
  });

  if (response.data.history) {
    for (const row of response.data.history) {
      for (const msg of row.messages) {
        const { data } = await gmail.users.messages.get({
          auth,
          userId: 'me',
          id: msg.id,
        });

        const gmailData = await parseMessage(data);
        await getOrCreateConversation({ integration, messageId: msg.id, gmailData });
      }
    }
  }
  integration.gmailData.historyId = historyId;
  integration.save();
};

export const trackGmail = async () => {
  const { GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_TOPIC, GOOGLE_SUPSCRIPTION_NAME, GOOGLE_PROJECT_ID } = process.env;
  const pubsubClient = PubSub({
    projectId: GOOGLE_PROJECT_ID,
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });

  if (!GOOGLE_TOPIC) {
    throw new Error('GOOGLE_TOPIC constiable did not found in env');
  }

  if (!GOOGLE_SUPSCRIPTION_NAME) {
    throw new Error('GOOGLE_SUPSCRIPTION_NAME constiable did not found in env');
  }

  const topic = pubsubClient.topic(GOOGLE_TOPIC);

  topic.createSubscription(GOOGLE_SUPSCRIPTION_NAME, ({}, subscription) => {
    const errorHandler = err => {
      subscription.removeListener('message', messageHandler);
      subscription.removeListener('error', errorHandler);
      throw new Error(err);
    };

    const messageHandler = message => {
      try {
        getGmailUpdates(JSON.parse(message.data.toString()));
      } catch (error) {
        throw error;
      }

      // All notifications need to be acknowledged as per the Cloud Pub/Sub
      message.ack();
    };

    subscription.on('error', errorHandler);
    subscription.on('message', messageHandler);
  });
};

const getOrCreateCustomer = async (email, integrationId) => {
  const customer = await Customers.findOne({ emails: { $in: [email] } });
  if (customer) {
    return customer;
  }

  return Customers.createCustomer({
    emails: [email],
    integrationId,
  });
};

const createMessage = async ({
  conversation,
  content,
  customer,
  gmailData,
}: {
  conversation: IConversationDocument;
  content: string;
  customer: ICustomerDocument;
  gmailData: IMsgGmail;
}): Promise<string> => {
  if (!conversation) {
    throw new Error('createMessage: Conversation not found');
  }

  // create new message
  const message = await ConversationMessages.createMessage({
    conversationId: conversation._id,
    customerId: customer._id,
    content,
    gmailData,
    internal: false,
  });

  return message._id;
};

const getOrCreateConversation = async value => {
  const { integration, messageId, gmailData } = value;
  const content = gmailData.subject;

  let conversation = await Conversations.findOne({
    'gmailData.messageId': messageId,
  }).sort({ createdAt: -1 });

  const status = CONVERSATION_STATUSES.NEW;

  const customer = await getOrCreateCustomer(gmailData.from, integration.id);

  if (!conversation) {
    conversation = await Conversations.createConversation({
      integrationId: integration._id,
      customerId: customer._id,
      status,
      content,

      // save gmail infos
      gmailData: {
        messageId,
      },
    });
  } else {
    conversation.status = CONVERSATION_STATUSES.OPEN;
    conversation.content = content;
    conversation.save();
  }

  // create new message
  return createMessage({
    conversation,
    content,
    customer,
    gmailData: {
      messageId,
      ...gmailData,
    },
  });
};
