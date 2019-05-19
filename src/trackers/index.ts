import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { connect } from '../db/connection';
import { trackIntegrations as trackFacebooks } from './facebookTracker';

// load environment variables
dotenv.config();

// connect to mongo database
connect();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json({
    limit: '10mb',
  }),
);

app.use(
  cors({
    credentials: true,
    origin: true,
  }),
);

const corsOptions = {
  credentials: true,
  origin: true,
};

app.use(cors(corsOptions));

// subscriptions server
const PORT = process.env.TRACKERS_PORT;

app.listen(PORT, () => {
  console.log(`Trackers server is now running on ${PORT}`);

  trackFacebooks(app);
});
