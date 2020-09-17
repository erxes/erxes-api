import { EmailDeliveries } from '../../../db/models';
import { requireLogin } from '../../permissions/wrappers';
import { paginate } from '../../utils';

const emailDeliveryQueries = {
  emailDeliveryDetail(_root, { _id }: { _id: string }) {
    return EmailDeliveries.findOne({ _id });
  },

  async transactionEmailDeliveries(_root, { status, ...params }: { status: string; page: number; perPage: number }) {
    const filter: { [key: string]: string | number } = { kind: 'transaction' };

    if (status) {
      filter.status = status;
    }

    const totalCount = await EmailDeliveries.countDocuments(filter);

    return {
      list: paginate(EmailDeliveries.find(filter), params).sort({ createdAt: -1 }),
      totalCount,
    };
  },
};

requireLogin(emailDeliveryQueries, 'emailDeliveryDetail');
requireLogin(emailDeliveryQueries, 'transactionEmailDeliveries');

export default emailDeliveryQueries;
