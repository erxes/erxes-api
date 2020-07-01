import * as dotenv from 'dotenv';
import * as express from 'express';
import { connect } from '../connection';
import { initConsumer } from '../messageBroker';
import { initRedis } from '../redisClient';
import { debugCrons } from '../utils';
import './verifier';

// load environment variables
dotenv.config();

const app = express();

// for health check
app.get('/status', async (_req, res) => {
  res.end('ok');
});

const { PORT_CRONS = 3600 } = process.env;

app.listen(PORT_CRONS, () => {
  // connect to mongo database
  connect().then(async () => {
    initConsumer();
    initRedis();
  });

  debugCrons(`Cron Server is now running on ${PORT_CRONS}`);
});
