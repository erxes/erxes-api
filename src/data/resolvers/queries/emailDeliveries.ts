import { EmailDeliveries } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const emailDeliveriesQueries = {
  async emailDeliveryDetail(_root, { _id }: { _id: string }) {
    return EmailDeliveries.findOne({ _id });
  },
};

moduleRequireLogin(emailDeliveriesQueries);

export default emailDeliveriesQueries;
