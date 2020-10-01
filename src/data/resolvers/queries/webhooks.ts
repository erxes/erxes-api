import { Webhooks } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const webhookQueries = {
  /**
   * Webhooks list
   */
  webhooks(_root, { isOutgoing }: { isOutgoing: boolean }) {
    return Webhooks.find({ isOutgoing });
  },

  /**
   * Get one Webhook
   */
  webhookDetail(_root, { _id }: { _id: string }) {
    return Webhooks.findOne({ _id });
  },

  async webhooksTotalCount(_root, { isOutgoing }: { isOutgoing: boolean }, { commonQuerySelector }: IContext) {
    return Webhooks.find({ ...commonQuerySelector, isOutgoing }).countDocuments();
  },
};

requireLogin(webhookQueries, 'webhookDetail');
checkPermission(webhookQueries, 'webhooks', 'showWebhooks', []);

export default webhookQueries;
