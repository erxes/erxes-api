import { Channels, Conversations, Integrations } from '../../../db/models';
import { subscriptionWrapperWithFilter } from './util';

export default {
  /*
   * Listen for conversation changes like status, assignee, read state
   */
  conversationChanged: subscriptionWrapperWithFilter('conversationChanged', ({ conversationId }, variables) => {
    return conversationId === variables._id;
  }),

  /*
   * Listen for new message insertion
   */
  conversationMessageInserted: subscriptionWrapperWithFilter(
    'conversationMessageInserted',
    ({ conversationId }, variables) => {
      return conversationId === variables._id;
    },
  ),

  /*
   * Admin is listening for this subscription to show unread notification
   */
  conversationClientMessageInserted: subscriptionWrapperWithFilter(
    'conversationClientMessageInserted',
    async ({ conversationId }, variables) => {
      const conversation = await Conversations.findOne({ _id: conversationId }, { integrationId: 1 });

      if (!conversation) {
        return false;
      }

      const integration = await Integrations.findOne({ _id: conversation.integrationId }, { _id: 1 });

      if (!integration) {
        return false;
      }

      const availableChannelsCount = await Channels.count({
        integrationIds: { $in: [integration._id] },
        memberIds: { $in: [variables.userId] },
      });

      return availableChannelsCount > 0;
    },
  ),

  /*
   * Widget is listening for this subscription to show unread notification
   */
  conversationAdminMessageInserted: subscriptionWrapperWithFilter(
    'conversationAdminMessageInserted',
    ({ customerId }, variables) => {
      return customerId === variables.customerId;
    },
  ),
};
