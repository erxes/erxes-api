import { Customers, RobotJobs } from '../../../db/models';
import { applyTemplate } from '../../utils';

export const jobDetail = async (_id: string) => {
  const job = await RobotJobs.findOne({ _id });

  if (!job) {
    throw new Error(`Job not found ${_id}`);
  }

  const data: any = {};

  if (job.type === 'customerScoring') {
    const scoreMap: Array<{ name: string; score: number }> = [];

    for (const map of job.data.scoreMap) {
      const customer = await Customers.findOne({ _id: map._id });

      if (!customer) {
        continue;
      }

      scoreMap.push({
        name: `${customer.firstName} ${customer.lastName}`,
        score: map.score,
      });
    }

    data.scoreMap = scoreMap;
  }

  return applyTemplate('robotJobs', `${job.type}_detailed`, data);
};
