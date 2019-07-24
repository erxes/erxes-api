import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { connect } from '../db/connection';
import { debugCrons } from '../debuggers';

import './activityLogs';
import './conversations';
import './deals';

// load environment variables
dotenv.config();

// connect to mongo database
connect();

const app = express();

// for health check
app.get('/status', async (_req, res) => {
  res.end('ok');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error(error.stack);
  res.status(500).send(error.message);
});

const { PORT_CRONS } = process.env;

app.listen(PORT_CRONS, () => {
  debugCrons(`Cron Server is now running on ${PORT_CRONS}`);
});
