import * as PubSub from '@google-cloud/pubsub';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as request from 'request';
import { CONVERSATION_STATUSES } from '../data/constants';
import { ActivityLogs, ConversationMessages, Conversations, Customers, Integrations } from '../db/models';
import { IGmail as IMsgGmail } from '../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { getOauthClient } from './googleTracker';
import { ICustomerDocument } from '../db/models/definitions/customers';

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
    'Content-Type: text/plain; charset="UTF-8"',
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
      ActivityLogs.createGmailLog(subject, cocType, cocId, userId, integrationId);

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

/**
 * Get gmail inbox updates
 */
export const getGmailUpdates = async ({ emailAddress, historyId }: { emailAddress: string; historyId: string }) => {
  console.log('email', emailAddress);
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

        const gmailData: { content: string; attachments: string[] } = {
          content: '',
          attachments: [],
        };

        for (const header of data.payload.headers) {
          const keyHeader = header.name.toLowerCase();
          if (['from', 'to', 'subject', 'cc', 'bcc'].indexOf(keyHeader) !== -1) {
            gmailData[keyHeader] = header.value;
          }
        }
        if (data.payload && data.payload.parts) {
          for (const part of data.payload.parts) {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
              gmailData.content = Buffer.from(part.body.data, 'base64').toString();
            } else if (part.mimeType === 'multipart/related') {
              for (const filePayload of part.parts) {
                const filePath = `${__dirname}/../private/gmail/${filePayload.filename}`;
                await fs.writeFile(filePath, filePayload.body.data, 'utf8', error => {
                  if (error) {
                    throw error;
                  }
                });
                gmailData.attachments.push(filePath);
              }
            }
          }
        } else {
          gmailData.content = Buffer.from(data.payload.body.data, 'base64').toString();
        }
        getOrCreateConversation({ integration, messageId: msg.id, gmailData });
      }
    }
  }
  integration.gmailData.historyId = historyId;
  integration.save();
  return response.data;
};

export const trackGmail = async () => {
  const { GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_TOPIC, GOOGLE_SUPSCRIPTION_NAME, GOOGLE_PROJECT_ID } = process.env;
  const pubsubClient = PubSub({
    projectId: GOOGLE_PROJECT_ID,
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });

  if (!GOOGLE_TOPIC) {
    throw new Error('GOOGLE_TOPIC variable does not found in env');
  }

  if (!GOOGLE_SUPSCRIPTION_NAME) {
    throw new Error('GOOGLE_SUPSCRIPTION_NAME variable does not found in env');
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

  // updating conversation content
  await Conversations.update({ _id: conversation._id }, { $set: { content } });
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
  }

  // create new message
  return createMessage({
    conversation,
    content,
    customer,
    gmailData,
  });
};
