import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as formidable from 'formidable';
import * as fs from 'fs';
import { createServer } from 'http';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as request from 'request';
import { filterXSS } from 'xss';
import apolloServer from './apolloClient';
import { buildFile } from './data/modules/fileExporter/exporter';
import insightExports from './data/modules/insights/insightExports';
import {
  checkFile,
  deleteFile,
  getEnv,
  handleUnsubscription,
  readFileRequest,
  registerOnboardHistory,
  uploadFile,
} from './data/utils';
import { connect } from './db/connection';
import { debugBase, debugExternalApi, debugInit } from './debuggers';
import { identifyCustomer, trackCustomEvent, trackViewPageEvent, updateCustomerProperty } from './events';
import './messageBroker';
import userMiddleware from './middlewares/userMiddleware';
import widgetsMiddleware from './middlewares/widgetsMiddleware';
import { initRedis } from './redisClient';

initRedis();

// load environment variables
dotenv.config();

const { NODE_ENV, JWT_TOKEN_SECRET } = process.env;

if (!JWT_TOKEN_SECRET) {
  throw new Error('Please configure JWT_TOKEN_SECRET environment variable.');
}

const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN', defaultValue: '' });
const WIDGETS_DOMAIN = getEnv({ name: 'WIDGETS_DOMAIN', defaultValue: '' });
const INTEGRATIONS_API_DOMAIN = getEnv({ name: 'INTEGRATIONS_API_DOMAIN', defaultValue: '' });

// firebase app initialization
fs.exists(path.join(__dirname, '..', '/google_cred.json'), exists => {
  if (!exists) {
    return;
  }

  const admin = require('firebase-admin').default;
  const serviceAccount = require('../google_cred.json');
  const firebaseServiceAccount = serviceAccount;

  if (firebaseServiceAccount.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseServiceAccount),
    });
  }
});

// connect to mongo database
connect();

const app = express();

app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json({
    limit: '15mb',
  }),
);
app.use(cookieParser());

const corsOptions = {
  credentials: true,
  origin: [MAIN_APP_DOMAIN, WIDGETS_DOMAIN],
};

app.use(cors(corsOptions));

app.get('/script-manager', widgetsMiddleware);

// events
app.post('/events-receive', async (req, res) => {
  const { name, customerId, attributes } = req.body;

  try {
    const response =
      name === 'pageView'
        ? await trackViewPageEvent({ customerId, attributes })
        : trackCustomEvent({ name, customerId, attributes });
    return res.json(response);
  } catch (e) {
    debugBase(e.message);
    return res.json({});
  }
});

app.post('/events-identify-customer', async (req, res) => {
  const { args } = req.body;

  try {
    const response = await identifyCustomer(args);
    return res.json(response);
  } catch (e) {
    debugBase(e.message);
    return res.json({});
  }
});

app.post('/events-update-customer-property', async (req, res) => {
  try {
    const response = await updateCustomerProperty(req.body);
    return res.json(response);
  } catch (e) {
    debugBase(e.message);
    return res.json({});
  }
});

app.use(userMiddleware);

app.use('/static', express.static(path.join(__dirname, 'private')));

app.get('/download-template', async (req: any, res) => {
  const DOMAIN = getEnv({ name: 'DOMAIN' });
  const name = req.query.name;

  registerOnboardHistory({ type: `${name}Download`, user: req.user });

  return res.redirect(`${DOMAIN}/static/importTemplates/${name}`);
});

// for health check
app.get('/status', async (_req, res) => {
  res.end('ok');
});

// export insights
app.get('/insights-export', async (req: any, res) => {
  try {
    const { name, response } = await insightExports(req.query, req.user);

    res.attachment(`${name}.xlsx`);

    return res.send(response);
  } catch (e) {
    return res.end(filterXSS(e.message));
  }
});

// export board
app.get('/file-export', async (req: any, res) => {
  const { query, user } = req;

  let result: { name: string; response: string };

  try {
    result = await buildFile(query, user);

    res.attachment(`${result.name}.xlsx`);

    return res.send(result.response);
  } catch (e) {
    return res.end(filterXSS(e.message));
  }
});

// read file
app.get('/read-file', async (req: any, res) => {
  const key = req.query.key;

  if (!key) {
    return res.send('Invalid key');
  }

  try {
    const response = await readFileRequest(key);

    res.attachment(key);

    return res.send(response);
  } catch (e) {
    return res.end(filterXSS(e.message));
  }
});

// get mail attachment file
app.get('/read-mail-attachment', async (req: any, res) => {
  const { messageId, attachmentId, kind, integrationId, filename, contentType } = req.query;

  if (!messageId || !attachmentId || !integrationId || !contentType) {
    return res.status(404).send('Attachment not found');
  }

  const integrationPath = kind.includes('nylas') ? 'nylas' : kind;

  res.redirect(
    `${INTEGRATIONS_API_DOMAIN}/${integrationPath}/get-attachment?messageId=${messageId}&attachmentId=${attachmentId}&integrationId=${integrationId}&filename=${filename}&contentType=${contentType}`,
  );
});

// delete file
app.post('/delete-file', async (req: any, res) => {
  // require login
  if (!req.user) {
    return res.end('foribidden');
  }

  const status = await deleteFile(req.body.fileName);

  if (status === 'ok') {
    return res.send(status);
  }

  return res.status(500).send(status);
});

// file upload
app.post('/upload-file', async (req: any, res, next) => {
  if (req.query.kind === 'nylas') {
    debugExternalApi(`Pipeing request to ${INTEGRATIONS_API_DOMAIN}`);

    return req.pipe(
      request
        .post(`${INTEGRATIONS_API_DOMAIN}/nylas/upload`)
        .on('response', response => {
          if (response.statusCode !== 200) {
            return next(response.statusMessage);
          }

          return response.pipe(res);
        })
        .on('error', e => {
          debugExternalApi(`Error from pipe ${e.message}`);
          next(e);
        }),
    );
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (_error, _fields, response) => {
    const file = response.file || response.upload;

    // check file ====
    const status = await checkFile(file, req.headers.source);

    if (status === 'ok') {
      try {
        const result = await uploadFile(file, response.upload ? true : false);

        return res.send(result);
      } catch (e) {
        return res.status(500).send(filterXSS(e.message));
      }
    }

    return res.status(500).send(status);
  });
});

// redirect to integration
app.get('/connect-integration', async (req: any, res, _next) => {
  if (!req.user) {
    return res.end('forbidden');
  }

  const { link, kind } = req.query;

  return res.redirect(`${INTEGRATIONS_API_DOMAIN}/${link}?kind=${kind}`);
});

// file import
app.post('/import-file', async (req: any, res, next) => {
  // require login
  if (!req.user) {
    return res.end('foribidden');
  }

  const WORKERS_API_DOMAIN = getEnv({ name: 'WORKERS_API_DOMAIN' });

  debugExternalApi(`Pipeing request to ${WORKERS_API_DOMAIN}`);

  try {
    const result = await req.pipe(
      request
        .post(`${WORKERS_API_DOMAIN}/import-file`)
        .on('response', response => {
          if (response.statusCode !== 200) {
            return next(response.statusMessage);
          }

          return response.pipe(res);
        })
        .on('error', e => {
          debugExternalApi(`Error from pipe ${e.message}`);
          next(e);
        }),
    );

    return result;
  } catch (e) {
    return res.json({ status: 'error', message: e.message });
  }
});

// engage unsubscribe
app.get('/unsubscribe', async (req: any, res) => {
  const unsubscribed = await handleUnsubscription(req.query);

  if (unsubscribed) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const template = fs.readFileSync(__dirname + '/private/emailTemplates/unsubscribe.html');
    res.send(template);
  }

  res.end();
});

apolloServer.applyMiddleware({ app, path: '/graphql', cors: corsOptions });

// handle engage trackers
app.post(`/service/engage/tracker`, async (req, res, next) => {
  const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

  const url = `${ENGAGES_API_DOMAIN}/service/engage/tracker`;

  return req.pipe(
    request
      .post(url)
      .on('response', response => {
        if (response.statusCode !== 200) {
          return next(response.statusMessage);
        }

        return response.pipe(res);
      })
      .on('error', e => {
        debugExternalApi(`Error from pipe ${e.message}`);
        next(e);
      }),
  );
});

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error(error.stack);
  res.status(500).send(error.message);
});

// Wrap the Express server
const httpServer = createServer(app);

// subscriptions server
const PORT = getEnv({ name: 'PORT' });

apolloServer.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  debugInit(`GraphQL Server is now running on ${PORT}`);
});

// GRACEFULL SHUTDOWN
process.stdin.resume(); // so the program will not close instantly

// If the Node process ends, close the Mongoose connection
if (NODE_ENV === 'production') {
  (['SIGINT', 'SIGTERM'] as NodeJS.Signals[]).forEach(sig => {
    process.on(sig, () => {
      // Stops the server from accepting new connections and finishes existing connections.
      httpServer.close((error: Error | undefined) => {
        if (error) {
          console.error(error.message);
          process.exit(1);
        }

        mongoose.connection.close(() => {
          console.log('Mongoose connection disconnected');
          process.exit(0);
        });
      });
    });
  });
}
