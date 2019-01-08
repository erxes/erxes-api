import { google } from 'googleapis';

const SCOPES_CALENDAR = ['https://www.googleapis.com/auth/calendar'];
const SCOPES_GMAIL = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

export const getOauthClient = (service?: string) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GMAIL_REDIRECT_URL } = process.env;

  const redirectUrl = service === 'gmail' ? GMAIL_REDIRECT_URL : GOOGLE_REDIRECT_URI;

  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUrl);
};

/**
 * Get auth url defends on google services such us gmail, calendar
 */
export const getAuthorizeUrl = (service?: string) => {
  const oauthClient = getOauthClient(service);
  const scopes = service === 'gmail' ? SCOPES_GMAIL : SCOPES_CALENDAR;

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
};

export const getAccessToken = (code: string, service?: string) => {
  const oauthClient = getOauthClient(service);

  return new Promise((resolve, reject) =>
    oauthClient.getToken(code, (err: any, token: any) => {
      if (err) {
        return reject(err.response.data.error);
      }

      return resolve(token);
    }),
  );
};

export const createMeetEvent = (credentials, event) => {
  const auth = getOauthClient();

  auth.setCredentials(credentials);

  const calendar: any = google.calendar({ version: 'v3', auth });

  return new Promise((resolve, reject) => {
    calendar.events.insert(
      {
        auth,
        calendarId: 'primary',
        resource: {
          description: event.summary,
          conferenceData: {
            createRequest: { requestId: Math.random() },
          },
          ...event,
        },
        conferenceDataVersion: 1,
      },

      (error, response) => {
        if (error) {
          return reject(error);
        }

        return resolve(response.data);
      },
    );
  });
};
