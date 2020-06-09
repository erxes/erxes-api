import * as events from 'events';
import { debugCrons } from './debuggers';
import { addToArray, getArray } from './redisClient';

export const emitter = new events.EventEmitter();

export let canceledJobs: Date[] = [];
export let shouldKillProcess = false;

let subscribedJobs: Array<{ id: string; status: 'pending' | 'done' }> = [];

export const killProcess = (status: boolean): boolean => (shouldKillProcess = status);
export const generateJobId = (): string =>
  '_' +
  Math.random()
    .toString(36)
    .substr(2, 9);

emitter.on('start', data => {
  debugCrons(`Job subscribed with id: ${data.id}`);

  subscribedJobs.push(data);
});

emitter.on('end', data => {
  const { id, status } = data;

  const idx = subscribedJobs.findIndex(job => job.id === id);

  subscribedJobs[idx].status = status;

  debugCrons(`Job: ${id} is done`);
});

export const checkStatusAndShutdown = () => {
  const pendingJob = subscribedJobs.find(job => job.status === 'pending');

  if (pendingJob) {
    return debugCrons(`Job: ${pendingJob.id} is not finished status: ${pendingJob.status}`);
  }

  debugCrons('Processing shutdown...');

  emitter.removeAllListeners();

  subscribedJobs = [];
  canceledJobs = [];
  shouldKillProcess = false;

  process.exit(0);
};

export const storeJobs = async (date: Date) => {
  return addToArray('cancelled-jobs', date.getTime().toString());
};

export const resumeJobs = async () => {
  const response = await getArray('cancelled-jobs');

  if (!response) {
    debugCrons('No jobs found to resume');
  }

  debugCrons(response);
};
