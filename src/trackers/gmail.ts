import { CONVERSATION_STATUSES } from '../data/constants';
import { publishClientMessage, publishMessage } from '../data/resolvers/mutations/conversations';
import { ActivityLogs, ConversationMessages, Conversations, Customers, Integrations } from '../db/models';
import { IGmail as IMsgGmail } from '../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { utils } from './gmailTracker';

interface IAttachmentParams {
  data: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface IMailParams {
  integrationId: string;
  cocType: string;
  cocId: string;
  subject: string;
  body: string;
  toEmails: string;
  cc?: string;
  bcc?: string;
  attachments?: IAttachmentParams[];
  references?: string;
  headerId?: string;
  threadId?: string;
}

/**
 * Create string sequence that generates email body encrypted to base64
 */
const encodeEmail = async params => {
  const { toEmails, fromEmail, subject, body, attachments, ccEmails, bccEmails, headerId, references } = params;

  // split header to add reply References
  let rawHeader = ['Content-Type: multipart/mixed; boundary="erxes"', 'MIME-Version: 1.0'].join('\r\n');

  // if message is reply add follow references
  if (headerId) {
    rawHeader += [`References: ${references}`, `In-Reply-To: ${headerId}`].join('\r\n');
  }

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

  let rawEmail =
    rawHeader +
    [
      `From: ${fromEmail}`,
      `To: ${toEmails}`,
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
    for (const attach of attachments) {
      rawEmail += [
        '--erxes',
        `Content-Type: ${attach.mimeType}`,
        'MIME-Version: 1.0',
        `Content-Length: ${attach.size}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attach.filename}"`,
        '',
        attach.data,
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
  const { integrationId, cocType, cocId, threadId } = mailParams;

  const integration = await Integrations.findOne({ _id: integrationId });

  if (!integration || !integration.gmailData) {
    throw new Error(`Integration not found id with ${integrationId}`);
  }

  const fromEmail = integration.gmailData.email;
  // get raw string encrypted by base64
  const raw = await encodeEmail({ fromEmail, ...mailParams });

  const response = await utils.sendEmail(integration.gmailData.credentials, raw, threadId);

  // convert email params to json string for acvitity content
  const activityLogContent = JSON.stringify(mailParams);
  // create activity log
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

const getHeaderProperties = headers => {
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
  return gmailData;
};

const getBodyProperties = (headers, part, gmailData) => {
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
  let gmailData = getHeaderProperties(headers);
  gmailData.messageId = response.id;
  gmailData.threadId = response.threadId;

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

    gmailData = getBodyProperties(headers, part, gmailData);

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
    throw new Error(`Integration not found gmailData with ${emailAddress}`);
  }

  await utils.getMessagesByHistoryId(integration);

  integration.gmailData.historyId = historyId;
  await integration.save();
};

export const getOrCreateCustomer = async (email, integrationId) => {
  let primaryEmail;
  let firstName;
  let lastName;

  if (email.includes(' ')) {
    const info = email.split(' ');

    for (const val of info) {
      if (val.includes('@')) {
        primaryEmail = val.replace('<', '').replace('>', '');
      } else if (!firstName) {
        firstName = val;
      } else {
        lastName = val;
      }
    }
  } else {
    primaryEmail = email;
  }

  const customer = await Customers.findOne({ emails: { $in: [primaryEmail] } });
  if (customer) {
    return customer;
  }

  return Customers.createCustomer({
    primaryEmail,
    firstName,
    lastName,
    emails: [primaryEmail],
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

  // notifying conversation inserted
  publishClientMessage(message);

  // notify subscription server new message
  publishMessage(message, conversation.customerId);

  return message._id;
};

export const getOrCreateConversation = async value => {
  const { integration, messageId, gmailData } = value;
  const content = gmailData.subject;

  // check if message has arrived true return previous message instance
  const prevMessage = await ConversationMessages.findOne({
    'gmailData.messageId': messageId,
  }).sort({ createdAt: -1 });

  if (prevMessage) {
    return prevMessage;
  }

  let conversationMessage;

  if (gmailData.reply) {
    const replyHeaders = gmailData.reply.match(/\<\S+\>/gi);

    // check if message is reply save in one conversation
    conversationMessage = await ConversationMessages.findOne({
      'gmailData.headerId': { $in: replyHeaders },
    }).sort({ createdAt: -1 });
  }

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

export const getAttachment = async (conversationMessageId: string, attachmentId: string) => {
  const message = await ConversationMessages.findOne({ _id: conversationMessageId });
  if (!message) {
    throw new Error(`Conversation message not found id with ${conversationMessageId}`);
  }

  const conversation = await Conversations.findOne({ _id: message.conversationId });
  if (!conversation) {
    throw new Error(`Conversation not found id with ${message.conversationId}`);
  }

  const integration = await Integrations.findOne({ _id: conversation.integrationId });
  if (!integration || !integration.gmailData) {
    throw new Error(`Integration gmail data not found id with ${conversation.integrationId}`);
  }

  return utils.getGmailAttachment(integration.gmailData.credentials, message.gmailData, attachmentId);
};
