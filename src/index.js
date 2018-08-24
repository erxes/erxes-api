/* eslint-disable no-console */

import * as path from 'path';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import formidable from 'formidable';
import { Customers } from './db/models';
import { connect } from './db/connection';
import { userMiddleware } from './auth';
import schema from './data';
import { pubsub } from './data/resolvers/subscriptions';
import { uploadFile, importXlsFile } from './data/utils';
import { init } from './startup';

// load environment variables
dotenv.config();

// connect to mongo database
connect();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use(userMiddleware);

app.use('/graphql', graphqlExpress(req => ({ schema, context: { user: req.user } })));

app.use('/static', express.static(path.join(__dirname, 'private')));

// for health check
app.get('/status', async (req, res) => {
  res.end('ok');
});

// file upload
app.post('/upload-file', async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, response) => {
    const url = await uploadFile(response.file);

    return res.end(url);
  });
});

// file import
app.post('/import-file', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, response) => {
    importXlsFile(response.file, fields.type, { user: req.user })
      .then(result => {
        res.json(result);
      })
      .catch(e => {
        res.json(e);
      });
  });
});

// Wrap the Express server
const server = createServer(app);

// subscriptions server
const { PORT } = process.env;

server.listen(PORT, () => {
  console.log(`GraphQL Server is now running on ${PORT}`);

  // execute startup actions
  init(app);

  // Set up the WebSocket for handling GraphQL subscriptions
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema,

      keepAlive: 10000,

      onConnect(connectionParams, webSocket) {
        webSocket.on('message', async message => {
          const parsedMessage = JSON.parse(message).id || {};

          if (parsedMessage.type === 'messengerConnected') {
            webSocket.messengerData = parsedMessage.value;

            const customerId = webSocket.messengerData.customerId;

            // mark as online
            await Customers.markCustomerAsActive(customerId);

            // notify as connected
            pubsub.publish('customerConnectionChanged', {
              customerConnectionChanged: {
                _id: customerId,
                status: 'connected',
              },
            });
          }
        });
      },

      async onDisconnect(webSocket) {
        const messengerData = webSocket.messengerData;

        if (messengerData) {
          const customerId = messengerData.customerId;

          // mark as offline
          await Customers.markCustomerAsNotActive(customerId);

          // notify as disconnected
          pubsub.publish('customerConnectionChanged', {
            customerConnectionChanged: {
              _id: customerId,
              status: 'disconnected',
            },
          });
        }
      },
    },
    {
      server,
      path: '/subscriptions',
    },
  );
});

if (process.env.NODE_ENV === 'development') {
  console.log(`ws://localhost:${PORT}/subscriptions`);

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
    }),
  );
}
