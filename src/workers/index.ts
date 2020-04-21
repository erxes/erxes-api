import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { filterXSS } from 'xss';
import { connect } from '../db/connection';
import { debugWorkers } from '../debuggers';
import userMiddleware from '../middlewares/userMiddleware';
import { initRedis } from '../redisClient';
import './messageBroker';
import { init } from './startup';

// load environment variables
dotenv.config();

initRedis();

// connect to mongo database
connect();

const app = express();
app.disable('x-powered-by');

// for health check
app.get('/status', async (_req, res) => {
  res.end('ok');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(userMiddleware);

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error(error.stack);
  res.status(500).send(filterXSS(error.message));
});

const { PORT_WORKERS = 3700 } = process.env;

app.listen(PORT_WORKERS, () => {
  init();

  debugWorkers(`Workers server is now running on ${PORT_WORKERS}`);
});
