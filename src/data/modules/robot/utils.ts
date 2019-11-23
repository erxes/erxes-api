import { Companies, Customers } from '../../../db/models';
import { AIAPI } from '../../dataSources';
import { applyTemplate } from '../../utils';

export const consumeJobResult = async data => {
  const type = data.jobType;

  if (type === 'mergeCustomers') {
    const customerIds = data.customerIds;
    const randomCustomer = await Customers.findOne({ _id: { $in: customerIds } }).lean();

    if (randomCustomer) {
      delete randomCustomer._id;
      await Customers.mergeCustomers(customerIds, randomCustomer);
    }
  }

  if (type === 'fillCompanyInfo') {
    const results = data.results;

    for (const result of results) {
      const { _id, modifier } = result;

      await Companies.update({ _id }, { $set: modifier });
    }
  }

  if (type === 'customerScoring') {
    const { scoreMap } = data;

    const modifier = scoreMap.map(job => ({
      updateOne: {
        filter: {
          _id: job._id,
        },
        update: {
          $set: { profileScore: job.score, scoreExplanation: job.explanation },
        },
      },
    }));

    await Customers.bulkWrite(modifier);
  }
};

export const jobDetail = async (_id: string) => {
  const api = new AIAPI();

  const job = await api.getJobDetail(_id);

  return applyTemplate('robotJobs', `${job.type}_detailed`, job);
};
