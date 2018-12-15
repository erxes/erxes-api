import { google } from 'googleapis';
import * as schedule from 'node-schedule';
import { Accounts, Integrations } from '../db/models';
import { getOauthClient } from '../trackers/googleTracker';

/**
 * Send conversation messages to customer
 */
export const callGmailUsersWatch = async () => {
  const auth = getOauthClient('gmail');
  const gmail: any = await google.gmail('v1');
  const { GOOGLE_TOPIC } = process.env;

  const integrations = await Integrations.find({
    gmailData: { $exists: true },
  });

  if (!integrations) {
    return;
  }

  for (const integration of integrations) {
    if (integration.gmailData) {
      const account = await Accounts.findOne({ uid: integration.gmailData.email, kind: 'gmail' });

      if (!account) {
        throw new Error(`Account not found uid with ${integration.gmailData.email}`);
      }

      const credentials = {
        access_token: account.token,
        refresh_token: account.tokenSecret,
        scope: account.scope,
        expire_date: account.expireDate,
        token_type: 'Bearer',
      };

      auth.setCredentials(credentials);
      const { data } = await gmail.users.watch({
        auth,
        userId: 'me',
        requestBody: {
          topicName: GOOGLE_TOPIC,
        },
      });

      integration.gmailData.historyId = data.historyId;
      integration.gmailData.expiration = data.expiration;
      integration.save();
      console.log('saved', integration._id);
    }
  }
};

/**
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    |
 * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * └───────────────────────── second (0 - 59, OPTIONAL)
 */

schedule.scheduleJob('* 45 23 * *', () => {
  callGmailUsersWatch();
});

export default {
  callGmailUsersWatch,
};
