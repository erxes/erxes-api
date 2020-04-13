import * as dotenv from 'dotenv';
import { connect } from '../db/connection';
import { Deals, Tasks, Tickets } from '../db/models';

dotenv.config();

const command = async () => {
  await connect();

  await Deals.updateMany({}, {$inc: {order: + 1}});
  await Tasks.updateMany({}, {$inc: {order: + 1}});
  await Tickets.updateMany({}, {$inc: {order: + 1}});

  process.exit();
};

command();
