import * as AWS from 'aws-sdk';
import * as EmailValidator from 'email-deep-validator';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as requestify from 'requestify';
import { debugEmail, debugExternalApi } from '../debuggers';
import { getEnv, readFile } from './utils';

export interface IRequestParams {
  url?: string;
  path?: string;
  method?: string;
  headers?: { [key: string]: string };
  params?: { [key: string]: string };
  body?: { [key: string]: string };
  form?: { [key: string]: string };
}

/**
 * Apply template
 */
const applyTemplate = async (data: any, templateName: string) => {
  let template: any = await readFile(templateName);

  template = Handlebars.compile(template.toString());

  return template(data);
};

/**
 * Create default or ses transporter
 */
const createTransporter = ({ ses }) => {
  if (ses) {
    const AWS_SES_ACCESS_KEY_ID = getEnv({ name: 'AWS_SES_ACCESS_KEY_ID' });
    const AWS_SES_SECRET_ACCESS_KEY = getEnv({ name: 'AWS_SES_SECRET_ACCESS_KEY' });
    const AWS_REGION = getEnv({ name: 'AWS_REGION' });

    AWS.config.update({
      region: AWS_REGION,
      accessKeyId: AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: AWS_SES_SECRET_ACCESS_KEY,
    });

    return nodemailer.createTransport({
      SES: new AWS.SES({ apiVersion: '2010-12-01' }),
    });
  }

  const MAIL_SERVICE = getEnv({ name: 'MAIL_SERVICE' });
  const MAIL_PORT = getEnv({ name: 'MAIL_PORT' });
  const MAIL_USER = getEnv({ name: 'MAIL_USER' });
  const MAIL_PASS = getEnv({ name: 'MAIL_PASS' });
  const MAIL_HOST = getEnv({ name: 'MAIL_HOST' });

  return nodemailer.createTransport({
    service: MAIL_SERVICE,
    host: MAIL_HOST,
    port: MAIL_PORT,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
};

/**
 * Create AWS instance
 */
const createAWS = () => {
  const AWS_ACCESS_KEY_ID = getEnv({ name: 'AWS_ACCESS_KEY_ID' });
  const AWS_SECRET_ACCESS_KEY = getEnv({ name: 'AWS_SECRET_ACCESS_KEY' });
  const AWS_BUCKET = getEnv({ name: 'AWS_BUCKET' });
  const AWS_COMPATIBLE_SERVICE_ENDPOINT = getEnv({ name: 'AWS_COMPATIBLE_SERVICE_ENDPOINT' });
  const AWS_FORCE_PATH_STYLE = getEnv({ name: 'AWS_FORCE_PATH_STYLE' });

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET) {
    throw new Error('AWS credentials are not configured');
  }

  const options: { accessKeyId: string; secretAccessKey: string; endpoint?: string; s3ForcePathStyle?: boolean } = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };

  if (AWS_FORCE_PATH_STYLE === 'true') {
    options.s3ForcePathStyle = true;
  }

  if (AWS_COMPATIBLE_SERVICE_ENDPOINT) {
    options.endpoint = AWS_COMPATIBLE_SERVICE_ENDPOINT;
  }

  // initialize s3
  return new AWS.S3(options);
};

/**
 * Create Google Cloud Storage instance
 */
const createGCS = () => {
  const GOOGLE_APPLICATION_CREDENTIALS = getEnv({ name: 'GOOGLE_APPLICATION_CREDENTIALS' });
  const GOOGLE_PROJECT_ID = getEnv({ name: 'GOOGLE_PROJECT_ID' });
  const BUCKET = getEnv({ name: 'GOOGLE_CLOUD_STORAGE_BUCKET' });

  if (!GOOGLE_PROJECT_ID || !GOOGLE_APPLICATION_CREDENTIALS || !BUCKET) {
    throw new Error('Google Cloud Storage credentials are not configured');
  }

  const Storage = require('@google-cloud/storage').Storage;

  // initializing Google Cloud Storage
  return new Storage({
    projectId: GOOGLE_PROJECT_ID,
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });
};

/*
 * Save binary data to amazon s3
 */
export const uploadFileAWS = async (file: { name: string; path: string; type: string }): Promise<string> => {
  const AWS_BUCKET = getEnv({ name: 'AWS_BUCKET' });
  const AWS_PREFIX = getEnv({ name: 'AWS_PREFIX', defaultValue: '' });
  const IS_PUBLIC = getEnv({ name: 'FILE_SYSTEM_PUBLIC', defaultValue: 'true' });

  // initialize s3
  const s3 = createAWS();

  // generate unique name
  const fileName = `${AWS_PREFIX}${Math.random()}${file.name}`;

  // read file
  const buffer = await fs.readFileSync(file.path);

  // upload to s3
  const response: any = await new Promise((resolve, reject) => {
    s3.upload(
      {
        ContentType: file.type,
        Bucket: AWS_BUCKET,
        Key: fileName,
        Body: buffer,
        ACL: IS_PUBLIC === 'true' ? 'public-read' : undefined,
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      },
    );
  });

  return IS_PUBLIC === 'true' ? response.Location : fileName;
};

/*
 * Save file to google cloud storage
 */
export const uploadFileGCS = async (file: { name: string; path: string; type: string }): Promise<string> => {
  const BUCKET = getEnv({ name: 'GOOGLE_CLOUD_STORAGE_BUCKET' });
  const IS_PUBLIC = getEnv({ name: 'FILE_SYSTEM_PUBLIC', defaultValue: 'true' });

  // initialize GCS
  const storage = createGCS();

  // select bucket
  const bucket = storage.bucket(BUCKET);

  // generate unique name
  const fileName = `${Math.random()}${file.name}`;

  bucket.file(fileName);

  const response: any = await new Promise((resolve, reject) => {
    bucket.upload(
      file.path,
      {
        metadata: { contentType: file.type },
        public: IS_PUBLIC === 'true',
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }

        if (res) {
          return resolve(res);
        }
      },
    );
  });

  const { metadata, name } = response;

  return IS_PUBLIC === 'true' ? metadata.mediaLink : name;
};

/*
 * Save binary data to amazon s3
 */
export const uploadFile = async (file, fromEditor = false): Promise<any> => {
  const IS_PUBLIC = getEnv({ name: 'FILE_SYSTEM_PUBLIC', defaultValue: 'true' });
  const DOMAIN = getEnv({ name: 'DOMAIN' });
  const UPLOAD_SERVICE_TYPE = getEnv({ name: 'UPLOAD_SERVICE_TYPE', defaultValue: 'AWS' });

  const nameOrLink = UPLOAD_SERVICE_TYPE === 'AWS' ? await uploadFileAWS(file) : await uploadFileGCS(file);

  if (fromEditor) {
    const editorResult = { fileName: file.name, uploaded: 1, url: nameOrLink };

    if (IS_PUBLIC !== 'true') {
      editorResult.url = `${DOMAIN}/read-file?key=${nameOrLink}`;
    }

    return editorResult;
  }

  return nameOrLink;
};

/**
 * Read file from GCS, AWS
 */
export const readFileRequest = async (key: string): Promise<any> => {
  const UPLOAD_SERVICE_TYPE = getEnv({ name: 'UPLOAD_SERVICE_T`YPE', defaultValue: 'AWS' });

  if (UPLOAD_SERVICE_TYPE === 'GCS') {
    const GCS_BUCKET = getEnv({ name: 'GOOGLE_CLOUD_STORAGE_BUCKET' });
    const storage = createGCS();

    const bucket = storage.bucket(GCS_BUCKET);

    const file = bucket.file(key);

    // get a file buffer
    const [contents] = await file.download({});

    return contents;
  }

  const AWS_BUCKET = getEnv({ name: 'AWS_BUCKET' });
  const s3 = createAWS();

  return new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: AWS_BUCKET,
        Key: key,
      },
      (error, response) => {
        if (error) {
          return reject(error);
        }

        return resolve(response.Body);
      },
    );
  });
};

/**
 * Sends post request to specific url
 */
export const sendRequest = async (
  { url, method, headers, form, body, params }: IRequestParams,
  errorMessage?: string,
) => {
  const NODE_ENV = getEnv({ name: 'NODE_ENV' });
  const DOMAIN = getEnv({ name: 'DOMAIN' });

  if (NODE_ENV === 'test') {
    return;
  }

  debugExternalApi(`
    Sending request to
    url: ${url}
    method: ${method}
    body: ${JSON.stringify(body)}
    params: ${JSON.stringify(params)}
  `);

  try {
    const response = await requestify.request(url, {
      method,
      headers: { 'Content-Type': 'application/json', origin: DOMAIN, ...(headers || {}) },
      form,
      body,
      params,
    });

    const responseBody = response.getBody();

    debugExternalApi(`
      Success from : ${url}
      responseBody: ${JSON.stringify(responseBody)}
    `);

    return responseBody;
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      throw new Error(errorMessage);
    } else {
      const message = e.body || e.message;
      throw new Error(message);
    }
  }
};

/**
 * Send email
 */
export const sendEmail = async ({
  toEmails,
  fromEmail,
  title,
  template = {},
}: {
  toEmails?: string[];
  fromEmail?: string;
  title?: string;
  template?: { name?: string; data?: any; isCustom?: boolean };
}) => {
  const NODE_ENV = getEnv({ name: 'NODE_ENV' });
  const DEFAULT_EMAIL_SERVICE = getEnv({ name: 'DEFAULT_EMAIL_SERVICE', defaultValue: '' }) || 'SES';
  const COMPANY_EMAIL_FROM = getEnv({ name: 'COMPANY_EMAIL_FROM' });
  const AWS_SES_CONFIG_SET = getEnv({ name: 'AWS_SES_CONFIG_SET', defaultValue: '' });

  // do not send email it is running in test mode
  if (NODE_ENV === 'test') {
    return;
  }

  // try to create transporter or throw configuration error
  let transporter;

  try {
    transporter = createTransporter({ ses: DEFAULT_EMAIL_SERVICE === 'SES' });
  } catch (e) {
    return debugEmail(e.message);
  }

  const { isCustom, data, name } = template;

  // generate email content by given template
  let html = await applyTemplate(data, name || '');

  if (!isCustom) {
    html = await applyTemplate({ content: html }, 'base');
  }

  return (toEmails || []).map(toEmail => {
    const mailOptions = {
      from: fromEmail || COMPANY_EMAIL_FROM,
      to: toEmail,
      subject: title,
      html,
      headers: {
        'X-SES-CONFIGURATION-SET': AWS_SES_CONFIG_SET || 'erxes',
      },
    };

    return transporter.sendMail(mailOptions, (error, info) => {
      debugEmail(error);
      debugEmail(info);
    });
  });
};

/**
 * Validates email using MX record resolver
 * @param email as String
 */
export const validateEmail = async email => {
  const NODE_ENV = getEnv({ name: 'NODE_ENV' });

  if (NODE_ENV === 'test') {
    return true;
  }

  const emailValidator = new EmailValidator();
  const { validDomain, validMailbox } = await emailValidator.verify(email);

  if (!validDomain) {
    return false;
  }

  if (!validMailbox && validMailbox === null) {
    return false;
  }

  return true;
};

export default {
  sendEmail,
  validateEmail,
  createTransporter,
};
