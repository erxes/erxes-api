import * as schedule from 'node-schedule';
import { send } from '../data/resolvers/mutations/engageUtils';
import { EngageMessages } from '../db/models';
import { debugCrons } from '../debuggers';

const findMessages = (selector = {}) => {
  return EngageMessages.find({
    kind: { $in: ['auto', 'visitorAuto'] },
    isLive: true,
    ...selector,
  });
};

const runJobs = async messages => {
  for (const message of messages) {
    await send(message);
  }
};

// every minute at 1sec
schedule.scheduleJob('1 * * * * *', async () => {
  debugCrons('Checking every minute jobs ....');

  const messages = await findMessages({ 'scheduleDate.type': 'minute' });

  debugCrons(`Found every minute messages ${messages.length}`);

  await runJobs(messages);
});

// every hour at 10min:10sec
schedule.scheduleJob('10 10 * * * *', async () => {
  debugCrons('Checking every hour jobs ....');

  const messages = await findMessages({ 'scheduleDate.type': 'hour' });

  debugCrons(`Found every hour  messages ${messages.length}`);

  await runJobs(messages);
});

// every day at 11hour:20min:20sec
schedule.scheduleJob('20 20 11 * * *', async () => {
  debugCrons('Checking every day jobs ....');

  // every day messages ===========
  const everyDayMessages = await findMessages({ 'scheduleDate.type': 'day' });
  await runJobs(everyDayMessages);

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // every nth day messages =======
  const everyNthDayMessages = await findMessages({ 'scheduleDate.type': day.toString() });
  await runJobs(everyNthDayMessages);

  // every month messages ========
  let everyMonthMessages = await findMessages({ 'scheduleDate.type': 'month' });

  everyMonthMessages = everyMonthMessages.filter(message => {
    const { lastRunAt, scheduleDate } = message;

    if (!lastRunAt) {
      return true;
    }

    // ignore if last run month is this month
    if (lastRunAt.getMonth() === month) {
      return false;
    }

    return scheduleDate && scheduleDate.day === day.toString();
  });

  debugCrons(`Found every month messages ${everyMonthMessages.length}`);

  await runJobs(everyMonthMessages);

  await EngageMessages.updateMany(
    { _id: { $in: everyMonthMessages.map(m => m._id) } },
    { $set: { lastRunAt: new Date() } },
  );

  // every year messages ========
  let everyYearMessages = await findMessages({ 'scheduleDate.type': 'year' });

  everyYearMessages = everyYearMessages.filter(message => {
    const { lastRunAt, scheduleDate } = message;

    if (!lastRunAt) {
      return true;
    }

    // ignore if last run year is this year
    if (lastRunAt.getFullYear() === year) {
      return false;
    }

    if (scheduleDate && scheduleDate.month !== month.toString()) {
      return false;
    }

    return scheduleDate && scheduleDate.day === day.toString();
  });

  debugCrons(`Found every year messages ${everyYearMessages.length}`);

  await runJobs(everyYearMessages);

  await EngageMessages.updateMany(
    { _id: { $in: everyYearMessages.map(m => m._id) } },
    { $set: { lastRunAt: new Date() } },
  );
});
