import { Conversations, Customers, Integrations, Users } from '../../db/models';
import { IMessageDocument } from '../../db/models/definitions/conversationMessages';
import { utils } from '../../trackers/gmailTracker';

export default {
  user(message: IMessageDocument) {
    return Users.findOne({ _id: message.userId });
  },

  customer(message: IMessageDocument) {
    return Customers.findOne({ _id: message.customerId });
  },

  async gmailDataAttachments(message: IMessageDocument) {
    if (!message.gmailData) {
      return;
    }

    const conversation = await Conversations.findOne({ _id: message.conversationId });
    if (!conversation) {
      return;
    }

    const integration = await Integrations.findOne({ _id: conversation.integrationId });
    if (!integration || !integration.gmailData) {
      return;
    }

    return utils.getGmailAttachments(integration.gmailData.credentials, message.gmailData);
  },
};
