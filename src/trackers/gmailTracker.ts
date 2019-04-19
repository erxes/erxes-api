import * as PubSub from '@google-cloud/pubsub';
import { google } from 'googleapis';
import { getEnv } from '../data/utils';
import { Accounts } from '../db/models';
import { getGmailUpdates } from './gmail';
import { getAccessToken, getAuthorizeUrl, getOauthClient } from './googleTracker';

export const trackGmailLogin = expressApp => {
  expressApp.get('/gmailLogin', async (req, res) => {
    // we don't have a code yet
    // so we'll redirect to the oauth dialog
    if (!req.query.code) {
      if (!req.query.error) {
        return res.redirect(getAuthorizeUrl());
      }

      return res.send('access denied');
    }

    const credentials: any = await getAccessToken(req.query.code);

    if (!credentials.refresh_token) {
      return res.send('You must remove Erxes from your gmail apps before reconnecting this account.');
    }

    // get email address connected with
    const { data } = await getGmailUserProfile(credentials);
    const email = data.emailAddress || '';

    await Accounts.createAccount({
      name: email,
      uid: email,
      kind: 'gmail',
      token: credentials.access_token,
      tokenSecret: credentials.refresh_token,
      expireDate: credentials.expiry_date,
      scope: credentials.scope,
    });

    const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN' });

    return res.redirect(`${MAIN_APP_DOMAIN}/settings/integrations?gmailAuthorized=true`);
  });
};

/**
 * Get permission granted email information
 */
export const getGmailUserProfile = (credentials: any) => {
  const auth = getOauthClient();

  auth.setCredentials(credentials);

  const gmail = google.gmail('v1');

  return gmail.users.getProfile({ auth, userId: 'me' }).catch(({ response }) => {
    throw new Error(response.data.error.message);
  });
};

/**
 * Listening email that connected with
 */
export const trackGmail = async () => {
  const GOOGLE_APPLICATION_CREDENTIALS = getEnv({ name: 'GOOGLE_APPLICATION_CREDENTIALS' });
  const GOOGLE_TOPIC = getEnv({ name: 'GOOGLE_TOPIC' });
  const GOOGLE_SUBSCRIPTION_NAME = getEnv({ name: 'GOOGLE_SUBSCRIPTION_NAME' });
  const GOOGLE_PROJECT_ID = getEnv({ name: 'GOOGLE_PROJECT_ID' });

  if (!GOOGLE_APPLICATION_CREDENTIALS || !GOOGLE_TOPIC || !GOOGLE_SUBSCRIPTION_NAME || !GOOGLE_PROJECT_ID) {
    return;
  }

  const pubsubClient = PubSub({
    projectId: GOOGLE_PROJECT_ID,
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });

  const topic = pubsubClient.topic(GOOGLE_TOPIC);

  topic.createSubscription(GOOGLE_SUBSCRIPTION_NAME, (error, subscription) => {
    if (error) {
      throw error;
    }

    const errorHandler = (err: any) => {
      subscription.removeListener('message', messageHandler);
      subscription.removeListener('error', errorHandler);
      throw new Error(err);
    };

    const messageHandler = async (message: any) => {
      try {
        const data = JSON.parse(message.data.toString());
        await getGmailUpdates(data);
      } catch (error) {
        console.log(error.message);
      }

      // All notifications need to be acknowledged as per the Cloud Pub/Sub
      await message.ack();
    };

    subscription.on('error', errorHandler);
    subscription.on('message', messageHandler);
  });
};

export const stopReceivingEmail = (email: string, credentials: any) => {
  const auth = getOauthClient();
  const gmail: any = google.gmail('v1');

  auth.setCredentials(credentials);

  gmail.users.stop({
    auth,
    userId: email,
  });
};

export const utils = {
  getGmailUserProfile,
  stopReceivingEmail,
};
