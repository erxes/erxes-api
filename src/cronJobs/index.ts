import * as dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { connect } from '../db/connection';
import { debugCrons } from '../debuggers';

import { initRabbitMQ } from '../messageBroker';
import { checkStatusAndShutdown, killProcess, resumeJobs } from '../process';
import { initRedis } from '../redisClient';
import './activityLogs';
import './conversations';
import './deals';
import './engages';
import './integrations';
import './robot';

// load environment variables
dotenv.config();

const app = express();

// for health check
app.get('/status', async (_req, res) => {
  res.end('ok');
});

const { PORT_CRONS = 3600 } = process.env;

const server = http.createServer(app);

server.listen(PORT_CRONS, () => {
  // connect to mongo database
  connect().then(async () => {
    initRabbitMQ();
    initRedis();

    resumeJobs();
  });
  debugCrons(`Cron Server is now running on ${PORT_CRONS}`);
});

process.on('SIGINT', () => {
  debugCrons('Kill signal received');

  killProcess(true);

  server.close(() => {
    debugCrons('Server shutdown...');
  });

  setInterval(checkStatusAndShutdown, 1000);
});
