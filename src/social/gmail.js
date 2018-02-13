import google from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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
    return new Promise(function(resolve, reject) {
        oauth2Client.getToken(code, async (err, token) => {
            if (err) {
                reject(err);
                return;
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
const createEmail = async (to, from, subject, body) => {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "X-Upload-Content-Type: message/rfc822\n",
        "X-Upload-Content-Length: 2000000\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        body
    ].join('');

    return new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * send emails using gmail api
 * @param {object} tokens - access_token
 * @param {String} email - email subject
 * @param {String} content - email body
 * @param {String} toEmails - to emails with cc
 */
export const sendEmail = async ( tokens, subject, body, toEmails, fromEmail ) => {
    const auth = await getOAuth();
    auth.credentials = tokens;
    var gmail = await google.gmail('v1');
    var raw = await createEmail(toEmails, fromEmail, subject, body);

    await gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        resource: {
            raw: raw
        }
    }, function(err, response) {
        if( err ){
            throw new Error(err);
        }
        console.log(response);
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
    return new Promise(function(resolve, reject) {
        gmail.users.getProfile({
            auth: auth,
            userId: 'me'
        }, function(err, response) {
            if (err) {
                reject(err);
                throw new Error(err);
            }
            resolve(response.data);
        });
    });
}

// doing this to mock authenticate function in test
export const gmailUtils = {
    getUserProfile,
    sendEmail,
    authorize,
    getGmailAuthorizeUrl
};
  