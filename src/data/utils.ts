import * as fileType from 'file-type';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as strip from 'strip';
import * as xlsxPopulate from 'xlsx-populate';
import { Customers, Notifications, Users } from '../db/models';
import { IUser, IUserDocument } from '../db/models/definitions/users';
import { OnboardingHistories } from '../db/models/Robot';
import { debugBase, debugExternalApi } from '../debuggers';
import { graphqlPubsub } from '../pubsub';
import { IConversationMessageAdd } from './resolvers/mutations/conversations';
import { IRequestParams, sendEmail, sendRequest } from './thirdPartyUtils';

/*
 * Check that given file is not harmful
 */
export const checkFile = async file => {
  if (!file) {
    throw new Error('Invalid file');
  }

  const { size } = file;

  // 20mb
  if (size > 20000000) {
    return 'Too large file';
  }

  // read file
  const buffer = await fs.readFileSync(file.path);

  // determine file type using magic numbers
  const ft = fileType(buffer);

  if (!ft) {
    return 'Invalid file';
  }

  const UPLOAD_FILE_TYPES = getEnv({
    name: 'UPLOAD_FILE_TYPES',
    defaultValue:
      'image/png,image/jpeg,image/jpg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,',
  });

  const { mime } = ft;

  if (!UPLOAD_FILE_TYPES.split(',').includes(mime)) {
    return 'Invalid file';
  }

  return 'ok';
};

/**
 * Read contents of a file
 */
export const readFile = (filename: string) => {
  const filePath = `${__dirname}/../private/emailTemplates/${filename}.html`;

  return fs.readFileSync(filePath, 'utf8');
};

/**
 * Returns user's name or email
 */
const getUserDetail = (user: IUser) => {
  return (user.details && user.details.fullName) || user.email;
};

export interface ISendNotification {
  createdUser: IUserDocument;
  receivers: string[];
  title: string;
  content: string;
  notifType: string;
  link: string;
  action: string;
  contentType: string;
  contentTypeId: string;
}

/**
 * Send a notification
 */
const sendNotification = async (doc: ISendNotification) => {
  const { createdUser, receivers, title, content, notifType, action, contentType, contentTypeId } = doc;
  let link = doc.link;

  // remove duplicated ids
  const receiverIds = [...new Set(receivers)];

  // collecting emails
  const recipients = await Users.find({ _id: { $in: receiverIds } });

  // collect recipient emails
  const toEmails: string[] = [];

  for (const recipient of recipients) {
    if (recipient.getNotificationByEmail && recipient.email) {
      toEmails.push(recipient.email);
    }
  }

  // loop through receiver ids
  for (const receiverId of receiverIds) {
    try {
      // send web and mobile notification
      const notification = await Notifications.createNotification(
        { link, title, content, notifType, receiver: receiverId, action, contentType, contentTypeId },
        createdUser._id,
      );

      graphqlPubsub.publish('notificationInserted', {
        notificationInserted: {
          userId: receiverId,
          title: notification.title,
          content: notification.content,
        },
      });
    } catch (e) {
      // Any other error is serious
      if (e.message !== 'Configuration does not exist') {
        throw e;
      }
    }
  }

  const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN' });

  link = `${MAIN_APP_DOMAIN}${link}`;

  await sendEmail({
    toEmails,
    title: 'Notification',
    template: {
      name: 'notification',
      data: {
        notification: { ...doc, link },
        action,
        userName: getUserDetail(createdUser),
      },
    },
  });

  return true;
};

/**
 * Creates blank workbook
 */
export const createXlsFile = async () => {
  // Generating blank workbook
  const workbook = await xlsxPopulate.fromBlankAsync();

  return { workbook, sheet: workbook.sheet(0) };
};

/**
 * Generates downloadable xls file on the url
 */
export const generateXlsx = async (workbook: any): Promise<string> => {
  return workbook.outputAsync();
};

export interface ILogQueryParams {
  start?: string;
  end?: string;
  userId?: string;
  action?: string;
  page?: number;
  perPage?: number;
}

interface ILogParams {
  type: string;
  newData?: string;
  description?: string;
  object: any;
}

/**
 * Send request to crons api
 */
export const fetchCronsApi = ({ path, method, body, params }: IRequestParams) => {
  const CRONS_API_DOMAIN = getEnv({ name: 'CRONS_API_DOMAIN' });

  try {
    return sendRequest(
      { url: `${CRONS_API_DOMAIN}${path}`, method, body, params },
      'Failed to connect crons api. Check CRONS_API_DOMAIN env or crons api is not running',
    );
  } catch (e) {
    debugExternalApi(`Error occurred : ${e.body || e.message}`);
  }
};

/**
 * Send request to workers api
 */
export const fetchWorkersApi = ({ path, method, body, params }: IRequestParams) => {
  const WORKERS_API_DOMAIN = getEnv({ name: 'WORKERS_API_DOMAIN' });

  try {
    return sendRequest(
      { url: `${WORKERS_API_DOMAIN}${path}`, method, body, params },
      'Failed to connect workers api. Check WORKERS_API_DOMAIN env or workers api is not running',
    );
  } catch (e) {
    debugExternalApi(`Error occurred : ${e.body || e.message}`);
  }
};

/**
 * Prepares a create log request to log server
 * @param params Log document params
 * @param user User information from mutation context
 */
export const putCreateLog = (params: ILogParams, user: IUserDocument) => {
  const doc = { ...params, action: 'create', object: JSON.stringify(params.object) };

  registerOnboardHistory({ type: `${doc.type}Create`, user });

  return putLog(doc, user);
};

export const registerOnboardHistory = ({ type, user }: { type: string; user: IUserDocument }) =>
  OnboardingHistories.getOrCreate({ type, user })
    .then(({ status }) => {
      if (status === 'created') {
        graphqlPubsub.publish('onboardingChanged', {
          onboardingChanged: { userId: user._id, type },
        });
      }
    })
    .catch(e => debugBase(e));

/**
 * Prepares a create log request to log server
 * @param params Log document params
 * @param user User information from mutation context
 */
export const putUpdateLog = (params: ILogParams, user: IUserDocument) => {
  const doc = { ...params, action: 'update', object: JSON.stringify(params.object) };

  return putLog(doc, user);
};

/**
 * Prepares a create log request to log server
 * @param params Log document params
 * @param user User information from mutation context
 */
export const putDeleteLog = (params: ILogParams, user: IUserDocument) => {
  const doc = { ...params, action: 'delete', object: JSON.stringify(params.object) };

  return putLog(doc, user);
};

/**
 * Sends a request to logs api
 * @param {Object} body Request
 * @param {Object} user User information from mutation context
 */
const putLog = (body: ILogParams, user: IUserDocument) => {
  const LOGS_DOMAIN = getEnv({ name: 'LOGS_API_DOMAIN' });

  if (!LOGS_DOMAIN) {
    return;
  }

  const doc = {
    ...body,
    createdBy: user._id,
    unicode: user.username || user.email || user._id,
  };

  return sendRequest(
    { url: `${LOGS_DOMAIN}/logs/create`, method: 'post', body: { params: JSON.stringify(doc) } },
    'Failed to connect to logs api. Check whether LOGS_API_DOMAIN env is missing or logs api is not running',
  );
};

/**
 * Sends a request to logs api
 * @param {Object} param0 Request
 */
export const fetchLogs = (params: ILogQueryParams) => {
  const LOGS_DOMAIN = getEnv({ name: 'LOGS_API_DOMAIN' });

  if (!LOGS_DOMAIN) {
    return {
      logs: [],
      totalCount: 0,
    };
  }

  return sendRequest(
    { url: `${LOGS_DOMAIN}/logs`, method: 'get', body: { params: JSON.stringify(params) } },
    'Failed to connect to logs api. Check whether LOGS_API_DOMAIN env is missing or logs api is not running',
  );
};

export const authCookieOptions = () => {
  const oneDay = 1 * 24 * 3600 * 1000; // 1 day

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    maxAge: oneDay,
    secure: false,
  };

  const HTTPS = getEnv({ name: 'HTTPS', defaultValue: 'false' });

  if (HTTPS === 'true') {
    cookieOptions.secure = true;
  }

  return cookieOptions;
};

export const getEnv = ({ name, defaultValue }: { name: string; defaultValue?: string }): string => {
  const value = process.env[name];

  if (!value && typeof defaultValue !== 'undefined') {
    return defaultValue;
  }

  return value || '';
};

export const paginate = (collection, params: { ids?: string[]; page?: number; perPage?: number }) => {
  const { page = 0, perPage = 0, ids } = params || { ids: null };

  const _page = Number(page || '1');
  const _limit = Number(perPage || '20');

  if (ids) {
    return collection;
  }

  return collection.limit(_limit).skip((_page - 1) * _limit);
};

/*
 * Converts given value to date or if value in valid date
 * then returns default value
 */
export const fixDate = (value, defaultValue = new Date()): Date => {
  const date = new Date(value);

  if (!isNaN(date.getTime())) {
    return date;
  }

  return defaultValue;
};

export const getToday = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
};

export const getNextMonth = (date: Date): { start: number; end: number } => {
  const today = getToday(date);

  const month = (new Date().getMonth() + 1) % 12;
  const start = today.setMonth(month, 1);
  const end = today.setMonth(month + 1, 0);

  return { start, end };
};

/**
 *  Send conversation to integrations
 */

const sendConversationToIntegrations = (
  integrationId: string,
  conversationId: string,
  requestName: string,
  doc: IConversationMessageAdd,
  dataSources: any,
) => {
  if (dataSources && dataSources.IntegrationsAPI && requestName) {
    return dataSources.IntegrationsAPI[requestName]({
      conversationId,
      integrationId,
      content: strip(doc.content),
      attachments: doc.attachments || [],
    });
  }

  return null;
};

export default {
  sendNotification,
  readFile,
  sendConversationToIntegrations,
};

export const cleanHtml = (content?: string) => strip(content || '').substring(0, 100);

export const validSearchText = (values: string[]) => {
  const value = values.join(' ');

  if (value.length < 512) {
    return value;
  }

  return value.substring(0, 511);
};

const stringToRegex = (value: string) => {
  const specialChars = [...'{}[]\\^$.|?*+()'];

  const result = [...value].map(char => (specialChars.includes(char) ? '.?\\' + char : '.?' + char));

  return '.*' + result.join('').substring(2) + '.*';
};

export const regexSearchText = (searchValue: string) => {
  const result: any[] = [];

  searchValue = searchValue.replace(/\s\s+/g, ' ');

  const words = searchValue.split(' ');

  for (const word of words) {
    result.push({ searchText: new RegExp(`${stringToRegex(word)}`, 'mui') });
  }

  return { $and: result };
};

/**
 * Check user ids whether its added or removed from array of ids
 */
export const checkUserIds = (oldUserIds: string[], newUserIds: string[]) => {
  const removedUserIds = oldUserIds.filter(e => !newUserIds.includes(e));

  const addedUserIds = newUserIds.filter(e => !oldUserIds.includes(e));

  return { addedUserIds, removedUserIds };
};

/**
 * Send notification to mobile device from inbox conversations
 * @param {string} - title
 * @param {string} - body
 * @param {string} - customerId
 * @param {array} - receivers
 */
export const sendMobileNotification = async ({
  receivers,
  title,
  body,
  customerId,
  conversationId,
}: {
  receivers: string[];
  customerId?: string;
  title: string;
  body: string;
  conversationId: string;
}): Promise<void> => {
  if (!admin.apps.length) {
    return;
  }

  const transporter = admin.messaging();
  const tokens: string[] = [];

  if (receivers && receivers.length > 0) {
    tokens.push(...(await Users.find({ _id: { $in: receivers } }).distinct('deviceTokens')));
  }

  if (customerId) {
    tokens.push(...(await Customers.findOne({ _id: customerId }).distinct('deviceTokens')));
  }

  if (tokens.length > 0) {
    // send notification
    for (const token of tokens) {
      await transporter.send({ token, notification: { title, body }, data: { conversationId } });
    }
  }
};
