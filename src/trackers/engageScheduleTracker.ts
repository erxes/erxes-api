import * as moment from 'moment';
import * as schedule from 'node-schedule';
import { send } from '../data/resolvers/mutations/engageUtils';
import { IEngageMessageDocument, IScheduleDate } from '../db/models/definitions/engages';

interface IEngageSchedules {
  id: string;
  job: any;
}

// Track runtime cron job instances
export const ENGAGE_SCHEDULES: IEngageSchedules[] = [];

/**
 * Create cron job for an engage message
 */
export const createSchedule = (message: IEngageMessageDocument) => {
  const { scheduleDate } = message;

  if (scheduleDate) {
    const rule = createScheduleRule(scheduleDate);

    const job = schedule.scheduleJob(rule, () => {
      send(message);
    });

    // Collect cron job instances
    ENGAGE_SCHEDULES.push({ id: message._id, job });
  }
};

/**
 * Create cron job schedule rule
 */
export const createScheduleRule = (scheduleDate: IScheduleDate) => {
  if (!scheduleDate || (!scheduleDate.type && !scheduleDate.time)) {
    return '* 45 23 * ';
  }

  if (!scheduleDate.time) {
    return '* 45 23 * ';
  }

  const time = moment(new Date(scheduleDate.time));

  const hour = time.hour() || '*';
  const minute = time.minute() || '*';
  const month = scheduleDate.month || '*';

  let dayOfWeek = '*';
  let day: string | number = '*';

  // Schedule type day of week [0-6]
  if (scheduleDate.type && scheduleDate.type.length === 1) {
    dayOfWeek = scheduleDate.type || '*';
  }

  if (scheduleDate.type === 'month' || scheduleDate.type === 'year') {
    day = scheduleDate.day || '*';
  }

  /*
      *    *    *    *    *    *
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    │
    │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
    │    │    │    │    └───── month (1 - 12)
    │    │    │    └────────── day of month (1 - 31)
    │    │    └─────────────── hour (0 - 23)
    │    └──────────────────── minute (0 - 59)
    └───────────────────────── second (0 - 59, OPTIONAL)
  */

  return `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
};
