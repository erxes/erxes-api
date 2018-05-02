import google from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Integrations, ActivityLogs } from '../db/models';
import fs from 'fs';

var SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata'
];

/**
 * create string sequence that generates email body encrypted to base64
 * @return {Promise} return Promise resolving OAuth2Client
 */
const getOAuth = async() => {
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const clientId =  process.env.GMAIL_CLIENT_ID;
  const redirectUrl = process.env.GMAIL_REDIRECT_URL;

  return new OAuth2Client(clientId, clientSecret, redirectUrl);
}

/**
 * create string sequence that generates email body encrypted to base64
 * @param {String} code - generated from granted email
 * @return {Promise} return Promise resolving tokens
 */
export const authorize = async (code) => {
  const oauth2Client = await getOAuth();

  return new Promise((resolve, reject) => {
    oauth2Client.getToken(code, async (err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token);
    })
  });
}

/**
 * generate gmail api grant url
 * @return {String} return string url
 */
export const getGmailAuthorizeUrl = async () => {
  const oauth2Client = await getOAuth();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
}

/**
 * create string sequence that generates email body encrypted to base64
 * @param {String} to - to email
 * @param {String} from - from email
 * @param {String} subject - email subject
 * @param {String} message - email body
 * @return {String} return raw string encrypted by base64
 */
const encodeEmail = async (to, from, subject, body, cc) => {
  var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "X-Upload-Content-Type: message/rfc822\n",
    "X-Upload-Content-Length: 2000000\n",
    "to: ", to, "\n",
    "cc: ", cc, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    body, "\n"
  ].join('');

  return new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * send emails using gmail api
 * @param {object} tokens - access_token, refresh_token, type, expire_date
 * @param {String} email - email subject
 * @param {String} content - email body
 * @param {String} toEmails - to emails with cc
 */
export const sendGmail = async ({integrationId, cocType, cocId, subject, body, toEmails, cc}, user ) => {
  const integration = await Integrations.findOne({ _id: integrationId });

  if( !integration )
    throw new Error(`Integration not found id with ${integrationId}`);

  const tokens = integration.gmailData;
  const fromEmail = integration.gmailData.email;

  const auth = await getOAuth();
  auth.credentials = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
    token_type: tokens.tokenType
  };
  
  var gmail = await google.gmail('v1');
  var raw = await encodeEmail(toEmails, fromEmail, subject, body, cc);

  return new Promise((resolve, reject) => {
    gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      resource: {
        raw: raw
      }
    }, (err, response) => {
      if( err ){
        reject(err);
      }
      ActivityLogs.createGmailLog(subject, cocType, cocId, user);
      resolve(response)
    });
  });
}

/**
 * create string sequence that generates email body encrypted to base64
 * @param {Object} tokens - gmail api access_token
 * @return {Object} return Promise resolving user profile data such us 
 *  emailAddress, messagesTotal, threadsTotal, historyId
 */
export const getUserProfile = async(tokens) => {
  const auth = await getOAuth();
  auth.credentials = tokens;

  const gmail = await google.gmail('v1');
  return new Promise((resolve, reject) => {
    gmail.users.getProfile({
      auth: auth,
      userId: 'me'
    }, (err, response) => {
      if (err) {
        reject(err);
      }
      resolve(response.data);
    });
  });
}

// doing this to mock authenticate function in test
export const gmailUtils = {
  getUserProfile,
  sendGmail,
  authorize,
  getGmailAuthorizeUrl
};