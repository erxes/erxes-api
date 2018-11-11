import * as request from 'request';
import { CONVERSATION_STATUSES } from '../data/constants';
import { ActivityLogs, ConversationMessages, Conversations, Customers, Integrations } from '../db/models';
import { IGmail as IMsgGmail } from '../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { utils } from './gmailTracker';

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
export const getAttachIntoBuffer = (url: string) => {
  return new Promise((resolve, reject) =>
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
};

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
      const attach: any = await getAttachIntoBuffer(attachmentUrl);
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
  // get raw string encrypted by base64
  const raw = await encodeEmail(toEmails, fromEmail, subject, body, attachments, cc, bcc);

  const response = await utils.sendEmail(integration.gmailData.credentials, raw);

  const activityLogContent = JSON.stringify({
    toEmails,
    subject,
    body,
    attachments,
    cc,
    bcc,
  });

  await ActivityLogs.createGmailLog(activityLogContent, cocType, cocId, userId);

  return response;
};

/**
 * Get headers values
 */
export const mapHeaders = headers => {
  if (!headers) {
    return {};
  }

  return headers.reduce((result, header) => {
    result[header.name.toLowerCase()] = header.value;
    return result;
  }, {});
};

const getHeaderProperties = (headers, messageId) => {
  const gmailData: IMsgGmail = {};

  for (const headerKey of ['subject', 'from', 'to', 'cc', 'bcc', 'references']) {
    if (headers.hasOwnProperty(headerKey)) {
      gmailData[headerKey] = headers[headerKey];
    }
  }

  if (headers.hasOwnProperty('in-reply-to')) {
    gmailData.reply = headers['in-reply-to'];
  }

  gmailData.headerId = headers['message-id'];
  gmailData.messageId = messageId;

  return gmailData;
};

const getBodyProperties = (headers, part) => {
  const gmailData: IMsgGmail = {};
  const isHtml = part.mimeType && part.mimeType.includes('text/html');
  const isPlain = part.mimeType && part.mimeType.includes('text/plain');
  const cd = headers['content-disposition'];
  const isAttachment = cd && cd.includes('attachment');
  const isInline = cd && cd.includes('inline');

  // get html content
  if (isHtml && !isAttachment) {
    gmailData.textHtml = Buffer.from(part.body.data, 'base64').toString();

    // get plain text
  } else if (isPlain && !isAttachment) {
    gmailData.textPlain = Buffer.from(part.body.data, 'base64').toString();

    // get attachments
  } else if (isAttachment || isInline) {
    const body = part.body;

    if (!gmailData.attachments) {
      gmailData.attachments = [];
    }

    gmailData.attachments.push({
      filename: part.filename,
      mimeType: part.mimeType,
      size: body.size,
      attachmentId: body.attachmentId,
    });
  }

  return gmailData;
};

/**
 * Parse result of users.messages.get response
 */
export const parseMessage = response => {
  const payload = response.payload;
  if (!payload) {
    return {};
  }

  let headers = mapHeaders(payload.headers);
  let gmailData = getHeaderProperties(headers, response.id);

  let parts = [payload];
  let firstPartProcessed = false;

  while (parts.length !== 0) {
    const part = parts.shift();

    if (part.parts) {
      parts = parts.concat(part.parts);
    }

    if (firstPartProcessed) {
      headers = mapHeaders(part.headers);
    }

    if (!part.body) {
      continue;
    }

    gmailData = Object.assign(getBodyProperties(headers, part), gmailData);

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

  await utils.getMessagesByHistoryId(integration);

  integration.gmailData.historyId = historyId;
  await integration.save();
};

export const getOrCreateCustomer = async (email, integrationId) => {
  const customer = await Customers.findOne({ emails: { $in: [email] } });
  if (customer) {
    return customer;
  }

  return Customers.createCustomer({
    emails: [email],
    integrationId,
  });
};

export const createMessage = async ({
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

export const getOrCreateConversation = async value => {
  const { integration, messageId, gmailData } = value;
  const content = gmailData.subject;

  const conversationMessage = await ConversationMessages.findOne({
    'gmailData.headerId': { $regex: `.*${gmailData.reply}.*` },
  }).sort({ createdAt: -1 });

  const customer = await getOrCreateCustomer(gmailData.from, integration.id);

  let conversation;
  if (!conversationMessage) {
    // new conversation
    conversation = await Conversations.createConversation({
      integrationId: integration._id,
      customerId: customer._id,
      status: CONVERSATION_STATUSES.NEW,
      content,

      // save gmail infos
      gmailData: {
        messageId,
      },
    });
  } else {
    // reply message conversation
    conversation = await Conversations.findOne({ _id: conversationMessage.conversationId });
    conversation.status = CONVERSATION_STATUSES.OPEN;
    conversation.content = content;
    await conversation.save();
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
