import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as express from 'express';
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
  authCookieOptions,
  deleteFile,
  frontendEnv,
  getEnv,
  getSubServiceDomain,
  handleUnsubscription,
  readFileRequest,
  registerOnboardHistory,
} from './data/utils';
import { connect } from './db/connection';
import { debugBase, debugExternalApi, debugInit } from './debuggers';
import { identifyCustomer, trackCustomEvent, trackViewPageEvent, updateCustomerProperty } from './events';
import { initConsumer } from './messageBroker';
import { importer, uploader } from './middlewares/fileMiddleware';
import userMiddleware from './middlewares/userMiddleware';
import widgetsMiddleware from './middlewares/widgetsMiddleware';
import { initRedis } from './redisClient';
import init from './startup';

// load environment variables
dotenv.config();

const { NODE_ENV, JWT_TOKEN_SECRET } = process.env;

if (!JWT_TOKEN_SECRET) {
  throw new Error('Please configure JWT_TOKEN_SECRET environment variable.');
}

const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN' });
const WIDGETS_DOMAIN = getSubServiceDomain({ name: 'WIDGETS_DOMAIN' });
const INTEGRATIONS_API_DOMAIN = getSubServiceDomain({ name: 'INTEGRATIONS_API_DOMAIN' });

const app = express();

app.disable('x-powered-by');
app.use(express.urlencoded());
app.use(
  express.json({
    limit: '15mb',
  }),
);
app.use(cookieParser());

const corsOptions = {
  credentials: true,
  origin: [MAIN_APP_DOMAIN, WIDGETS_DOMAIN],
};

app.use(cors(corsOptions));

app.get('/set-frontend-cookies', async (req: any, res) => {
  const envMaps = JSON.parse(req.query.envs || '{}');

  for (const key of Object.keys(envMaps)) {
    res.cookie(key, envMaps[key], authCookieOptions(req.secure));
  }

  return res.send('success');
});

app.get('/script-manager', widgetsMiddleware);

// events
app.post('/events-receive', async (req, res) => {
  const { name, customerId, attributes } = req.body;

  try {
    const response =
      name === 'pageView'
        ? await trackViewPageEvent({ customerId, attributes })
        : await trackCustomEvent({ name, customerId, attributes });
    return res.json(response);
  } catch (e) {
    debugBase(e.message);
    return res.json({ status: 'success' });
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
  const name = req.query.name;

  registerOnboardHistory({ type: `${name}Download`, user: req.user });

  return res.redirect(`${frontendEnv({ name: 'API_URL', req })}/static/importTemplates/${name}`);
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
    `${INTEGRATIONS_API_DOMAIN}/${integrationPath}/get-attachment?messageId=${messageId}&attachmentId=${attachmentId}&integrationId=${integrationId}&filename=${filename}&contentType=${contentType}&userId=${req.user._id}`,
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

app.post('/upload-file', uploader);

// redirect to integration
app.get('/connect-integration', async (req: any, res, _next) => {
  if (!req.user) {
    return res.end('forbidden');
  }

  const { link, kind } = req.query;

  return res.redirect(`${INTEGRATIONS_API_DOMAIN}/${link}?kind=${kind}&userId=${req.user._id}`);
});

// file import
app.post('/import-file', importer);

// unsubscribe
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
  const ENGAGES_API_DOMAIN = getSubServiceDomain({ name: 'ENGAGES_API_DOMAIN' });

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
  // connect to mongo database
  connect().then(async () => {
    initConsumer().catch(e => {
      debugBase(`Error ocurred during rabbitmq init ${e.message}`);
    });

    initRedis();

    init()
      .then(() => {
        debugBase('Startup successfully started');
      })
      .catch(e => {
        debugBase(`Error occured while starting init: ${e.message}`);
      });
  });

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
