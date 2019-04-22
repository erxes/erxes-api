import { google } from 'googleapis';
import { getEnv } from '../data/utils';
import { IGmail as IMsgGmail } from '../db/models/definitions/conversationMessages';
import { parseMessage, refreshAccessToken, syncConversation, updateHistoryByLastReceived } from './gmail';
import { getOauthClient } from './googleTracker';

/**
 * Send email
 */
const sendEmail = (integrationId: string, credentials: any, raw: string, threadId?: string) => {
  const auth = getOAuth(integrationId, credentials);
  const gmail = google.gmail('v1');

  const data = {
    auth,
    userId: 'me',
    resource: {
      raw,
      threadId,
    },
  };

  return gmail.users.messages.send(data).catch(({ response }) => {
    throw new Error(response.data.error.message);
  });
};

/**
 * Get new messages by stored history id
 */
const getMessagesByHistoryId = async (historyId: string, integrationId: string, credentials: any) => {
  const auth = getOAuth(integrationId, credentials);
  const gmail = google.gmail('v1');

  const response = await gmail.users.history.list({
    auth,
    userId: 'me',
    startHistoryId: historyId,
  });

  if (!response.data.history) {
    return;
  }

  for (const history of response.data.history) {
    if (!history.messages) {
      continue;
    }

    await updateHistoryByLastReceived(integrationId, '' + history.id);

    for (const message of history.messages) {
      try {
        const { data } = await gmail.users.messages.get({
          auth,
          userId: 'me',
          id: message.id,
        });

        // get gmailData
        const gmailData = await parseMessage(data);
        if (gmailData) {
          await syncConversation(integrationId, gmailData);
        }
      } catch (e) {
        // catch & continue if email doesn't exist with message.id
        if (e.message === 'Not Found') {
          console.log(`Email not found id with ${message.id}`);
        } else {
          console.log(e.message);
        }
      }
    }
  }
};

/**
 * Get auth with valid credentials
 */
const getOAuth = (integrationId: string, credentials: any) => {
  const auth = getOauthClient();

  // Access tokens expire. This library will automatically use a refresh token to obtain a new access token
  auth.on('tokens', async tokens => {
    await refreshAccessToken(integrationId, tokens);
    credentials = tokens;
  });

  auth.setCredentials(credentials);
  return auth;
};

/**
 * Get attachment by attachmentId
 */
const getGmailAttachment = async (credentials: any, gmailData: IMsgGmail, attachmentId: string) => {
  if (!gmailData || !gmailData.attachments) {
    throw new Error('GmailData not found');
  }

  const attachment = await gmailData.attachments.find(a => a.attachmentId === attachmentId);

  if (!attachment) {
    throw new Error(`Gmail attachment not found id with ${attachmentId}`);
  }

  const { messageId } = gmailData;

  const gmail = await google.gmail('v1');
  const auth = getOauthClient();

  auth.setCredentials(credentials);

  return gmail.users.messages.attachments
    .get({
      auth,
      id: attachmentId,
      userId: 'me',
      messageId,
    })
    .catch(({ response }) => {
      throw new Error(response.data.error.message);
    })
    .then(({ data }) => {
      return {
        data: data.data,
        filename: attachment.filename,
      };
    });
};

const callWatch = (credentials: any, integrationId: string) => {
  const gmail: any = google.gmail('v1');
  const GOOGLE_TOPIC = getEnv({ name: 'GOOGLE_TOPIC' });
  const auth = getOAuth(integrationId, credentials);

  return gmail.users
    .watch({
      auth,
      userId: 'me',
      labelIds: [
        'CATEGORY_UPDATES',
        'DRAFT',
        'CATEGORY_PROMOTIONS',
        'CATEGORY_SOCIAL',
        'CATEGORY_FORUMS',
        'TRASH',
        'CHAT',
        'SPAM',
      ],
      labelFilterAction: 'exclude',
      requestBody: {
        topicName: GOOGLE_TOPIC,
      },
    })
    .catch(({ response }) => {
      throw new Error(response.data.error.message);
    });
};

export { sendEmail, getMessagesByHistoryId, getOAuth, getGmailAttachment, callWatch };
