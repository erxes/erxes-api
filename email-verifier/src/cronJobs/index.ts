import * as dotenv from 'dotenv';
import * as express from 'express';
import { connect, mongoStatus } from '../connection';
import { initConsumer, rabbitMQStatus } from '../messageBroker';
import { initRedis, redisStatus } from '../redisClient';
import { debugCrons } from '../utils';
import './verifier';

// load environment variables
dotenv.config();

const app = express();

// for health check
app.get('/status', async (_req, res, next) => {
  try {
    await mongoStatus();
  } catch (e) {
    debugCrons('MongoDB is not running');
    return next(e);
  }

  try {
    await redisStatus();
  } catch (e) {
    debugCrons('Redis is not running');
    return next(e);
  }

  try {
    await rabbitMQStatus();
  } catch (e) {
    debugCrons('RabbitMQ is not running');
    return next(e);
  }

  res.end('ok');
});

const { PORT_CRONS = 3600 } = process.env;

app.listen(PORT_CRONS, () => {
  // connect to mongo database
  connect()
    .then(async () => {
      initConsumer();
      initRedis();
    })
    .catch(error => {
      debugCrons(`Failed to initialize mongo. Error: ${error.message}`);
    });

  debugCrons(`Cron Server is now running on ${PORT_CRONS}`);
});
