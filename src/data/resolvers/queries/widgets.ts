import {
  Conversations,
  Integrations,
  KnowledgeBaseArticles as KnowledgeBaseArticlesModel,
  KnowledgeBaseCategories as KnowledgeBaseCategoriesModel,
  KnowledgeBaseTopics as KnowledgeBaseTopicsModel,
  Users,
} from '../../../db/models';
import Messages from '../../../db/models/ConversationMessages';

const isMessengerOnline = async (integrationId: string) => {
  const integration = await Integrations.findOne({ _id: integrationId });

  if (!integration) {
    return false;
  }

  if (!integration.messengerData) {
    return false;
  }

  const { availabilityMethod, isOnline, onlineHours } = integration.messengerData;

  const modifiedIntegration = {
    ...integration.toJSON(),
    messengerData: {
      availabilityMethod,
      isOnline,
      onlineHours,
    },
  };

  return Integrations.isOnline(modifiedIntegration);
};

const messengerSupporters = async (integrationId: string) => {
  const integration = await Integrations.findOne({ _id: integrationId });

  if (!integration) {
    return [];
  }

  const messengerData = integration.messengerData || { supporterIds: [] };

  return Users.find({ _id: { $in: messengerData.supporterIds } });
};

export default {
  /*
   * Search published articles that contain searchString (case insensitive)
   * in a topic found by topicId
   * @return {Promise} searched articles
   */
  async widgetsKnowledgeBaseArticles(_root: any, args: { topicId: string; searchString: string }) {
    const { topicId, searchString = '' } = args;

    let articleIds: string[] = [];

    const topic = await KnowledgeBaseTopicsModel.findOne({ _id: topicId });

    if (!topic) {
      return [];
    }

    const categories = await KnowledgeBaseCategoriesModel.find({
      _id: topic.categoryIds,
    });

    categories.forEach(category => {
      articleIds = [...articleIds, ...(category.articleIds || [])];
    });

    return KnowledgeBaseArticlesModel.find({
      _id: { $in: articleIds },
      content: { $regex: `.*${searchString.trim()}.*`, $options: 'i' },
      status: 'publish',
    });
  },

  widgetsGetMessengerIntegration(_root, args: { brandCode: string }) {
    return Integrations.getWidgetIntegration(args.brandCode, 'messenger');
  },

  widgetsConversations(_root, args: { integrationId: string; customerId: string }) {
    const { integrationId, customerId } = args;

    return Conversations.find({
      integrationId,
      customerId,
    }).sort({ createdAt: -1 });
  },

  async widgetsConversationDetail(_root, args: { _id: string; integrationId: string }) {
    const { _id, integrationId } = args;
    const conversation = await Conversations.findOne({ _id });

    if (!conversation) {
      return null;
    }

    return {
      _id,
      messages: await Conversations.getWidgetMessages(conversation._id),
      isOnline: await isMessengerOnline(integrationId),
      participatedUsers: await Users.find({
        _id: { $in: conversation.participatedUserIds },
      }),
      supporters: await messengerSupporters(integrationId),
    };
  },

  widgetsMessages(_root, args: { conversationId: string }) {
    const { conversationId } = args;

    return Conversations.getWidgetMessages(conversationId);
  },

  widgetsUnreadCount(_root, args: { conversationId: string }) {
    const { conversationId } = args;

    return Messages.countDocuments({
      conversationId,
      userId: { $exists: true },
      internal: false,
      isCustomerRead: { $ne: true },
    });
  },

  async widgetsTotalUnreadCount(_root, args: { integrationId: string; customerId: string }) {
    const { integrationId, customerId } = args;

    // find conversations
    const convs = await Conversations.find({ integrationId, customerId });

    // find read messages count
    return Messages.countDocuments(Conversations.unreadMessagesQuery(convs));
  },

  async widgetsMessengerSupporters(_root, { integrationId }: { integrationId: string }) {
    const integration = await Integrations.findOne({ _id: integrationId });

    if (!integration) {
      return [];
    }

    const messengerData = integration.messengerData || { supporterIds: [] };

    return Users.find({ _id: { $in: messengerData.supporterIds || [] } });
  },
};
