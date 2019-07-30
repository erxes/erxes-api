import { Conversations, Customers, Integrations, Users } from '../../db/models';
import { IMessageDocument } from '../../db/models/definitions/conversationMessages';
import { fetchIntegrationApi } from '../utils';

export default {
  user(message: IMessageDocument) {
    return Users.findOne({ _id: message.userId });
  },

  customer(message: IMessageDocument) {
    return Customers.findOne({ _id: message.customerId });
  },

  async gmailData(message: IMessageDocument) {
    const conversation = await Conversations.findOne({ _id: message.conversationId }).lean();

    if (!conversation || message.internal) {
      return null;
    }

    const integration = await Integrations.findOne({ _id: conversation.integrationId }).lean();

    if (integration.kind !== 'gmail') {
      return null;
    }

    return fetchIntegrationApi({
      path: '/gmail/get-message',
      method: 'GET',
      params: {
        erxesApiMessageId: message._id,
        integrationId: integration._id,
      },
    });
  },
};
