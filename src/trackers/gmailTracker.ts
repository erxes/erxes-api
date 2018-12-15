import * as PubSub from '@google-cloud/pubsub';
import { google } from 'googleapis';
import { getOauthClient } from './googleTracker';

import { getGmailUpdates, getOrCreateConversation, parseMessage } from './gmail';

/**
 * Get permission granted email information
 */
export const getGmailUserProfile = async (credentials): Promise<{ emailAddress?: string; historyId?: string }> => {
  const auth = getOauthClient('gmail');

  auth.setCredentials(credentials);

  const gmail = await google.gmail('v1');

  return new Promise((resolve, reject) => {
    gmail.users.getProfile({ auth, userId: 'me' }, (err, response) => {
      if (err) {
        reject(err);
      }

      if (response) {
        resolve(response.data);
      }
    });
  });
};

const sendEmail = async (credentials, raw, threadId) => {
  const auth = getOauthClient('gmail');

  auth.setCredentials(credentials);

  const gmail = await google.gmail('v1');
  const data = {
    auth,
    userId: 'me',
    resource: {
      raw,
      threadId,
    },
  };

  return gmail.users.messages.send(data);
};

/**
 * Get attachment by attachmentId
 */
const getGmailAttachment = async (credentials, gmailData, attachmentId) => {
  const gmail = await google.gmail('v1');
  const auth = getOauthClient('gmail');

  const { messageId } = gmailData;

  auth.setCredentials(credentials);

  const { data } = await gmail.users.messages.attachments.get({
    auth,
    id: attachmentId,
    userId: 'me',
    messageId,
  });

  const attachment = await gmailData.attachments.find(a => a.attachmentId === attachmentId);
  return {
    data: data.data,
    filename: attachment.filename,
  };
};

/**
 * Get new messages by stored history id
 */
const getMessagesByHistoryId = async (integration, credentials) => {
  const auth = getOauthClient('gmail');

  auth.setCredentials(credentials);

  const gmail = await google.gmail('v1');

  const response = await gmail.users.history.list({
    auth,
    userId: 'me',
    startHistoryId: integration.gmailData.historyId,
  });

  if (!response.data.history) {
    return;
  }

  for (const history of response.data.history) {
    if (!history.messages) {
      continue;
    }

    for (const message of history.messages) {
      const { data } = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id: message.id,
      });

      const gmailData = await parseMessage(data);
      await getOrCreateConversation({ integration, messageId: message.id, gmailData });
    }
  }
};

export const trackGmail = async () => {
  const { GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_TOPIC, GOOGLE_SUPSCRIPTION_NAME, GOOGLE_PROJECT_ID } = process.env;
  const pubsubClient = PubSub({
    projectId: GOOGLE_PROJECT_ID,
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });

  if (!GOOGLE_TOPIC) {
    throw new Error('GOOGLE_TOPIC not found in env');
  }

  if (!GOOGLE_SUPSCRIPTION_NAME) {
    throw new Error('GOOGLE_SUPSCRIPTION_NAME not found in env');
  }

  const topic = pubsubClient.topic(GOOGLE_TOPIC);

  topic.createSubscription(GOOGLE_SUPSCRIPTION_NAME, (error, subscription) => {
    if (error) {
      throw error;
    }

    const errorHandler = err => {
      subscription.removeListener('message', messageHandler);
      subscription.removeListener('error', errorHandler);
      throw new Error(err);
    };

    const messageHandler = message => {
      try {
        getGmailUpdates(JSON.parse(message.data.toString()));
      } catch (error) {
        message.stop();
        // test message from pub/sub publish message
        console.log(Buffer.from(message.data, 'base64').toString());
      }

      // All notifications need to be acknowledged as per the Cloud Pub/Sub
      message.ack();
    };

    subscription.on('error', errorHandler);
    subscription.on('message', messageHandler);
  });
};

export const utils = {
  getMessagesByHistoryId,
  getGmailAttachment,
  sendEmail,
};
