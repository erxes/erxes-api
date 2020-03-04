import * as schedule from 'node-schedule';
import { fetchBySegments } from '../data/modules/segments/queryBuilder';
import { ActivityLogs, Companies, Customers, Segments } from '../db/models';

/**
 * Send conversation messages to customer
 */
export const createActivityLogsFromSegments = async () => {
  const segments = await Segments.find({});

  for (const segment of segments) {
    const ids = await fetchBySegments(segment);

    const customers = await Customers.find({ _id: { $in: ids } });
    const companies = await Companies.find({ _id: { $in: ids } });

    for (const customer of customers) {
      await ActivityLogs.createSegmentLog(segment, customer, 'customer');
    }

    for (const company of companies) {
      await ActivityLogs.createSegmentLog(segment, company, 'company');
    }
  }
};

/**
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    |
 * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * └───────────────────────── second (0 - 59, OPTIONAL)
 */
schedule.scheduleJob('0 45 23 * * *', () => {
  createActivityLogsFromSegments();
});
