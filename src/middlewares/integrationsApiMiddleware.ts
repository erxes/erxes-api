import { ActivityLogs, ConversationMessages, Conversations, Customers, Integrations } from '../db/models';
import { CONVERSATION_STATUSES } from '../db/models/definitions/constants';
import { graphqlPubsub } from '../pubsub';

interface IMessage {
  status: string;
  attachments: string[];
  readUserIds: string[];
  content?: string;
  updatedAt?: Date;
}

/*
 * Handle requests from integrations api
 */
const integrationsApiMiddleware = async (req, res) => {
  const { action, metaInfo, payload } = req.body;
  const doc = JSON.parse(payload || '{}');

  if (action === 'get-create-update-customer') {
    const integration = await Integrations.findOne({ _id: doc.integrationId });

    if (!integration) {
      throw new Error(`Integration not found: ${doc.integrationId}`);
    }

    const { primaryEmail, primaryPhone } = doc;

    let customer;

    const getCustomer = async selector => Customers.findOne(selector).lean();

    if (primaryPhone) {
      customer = await getCustomer({ primaryPhone });

      if (customer) {
        await Customers.updateCustomer(customer._id, doc);
        return res.json({ _id: customer._id });
      }
    }

    if (primaryEmail) {
      customer = await getCustomer({ primaryEmail });
    }

    if (customer) {
      return res.json({ _id: customer._id });
    } else {
      customer = await Customers.createCustomer({
        ...doc,
        scopeBrandIds: integration.brandId,
      });
    }

    return res.json({ _id: customer._id });
  }

  if (action === 'create-or-update-conversation') {
    if (doc.conversationId) {
      const { conversationId, content } = doc;

      await Conversations.updateOne({ _id: conversationId }, { $set: { content } });

      return res.json({ _id: conversationId });
    }

    const conversation = await Conversations.createConversation(doc);

    await ActivityLogs.createConversationLog(conversation);

    return res.json({ _id: conversation._id });
  }

  if (action === 'create-conversation-message') {
    const message = await ConversationMessages.createMessage(doc);

    const messageDoc: IMessage = {
      // Reopen its conversation if it's closed
      status: doc.unread || doc.unread === undefined ? CONVERSATION_STATUSES.OPEN : CONVERSATION_STATUSES.CLOSED,

      attachments: message.attachments,

      // Mark as unread
      readUserIds: [],
    };

    if (message.content && metaInfo === 'replaceContent') {
      messageDoc.content = message.content;
    }

    if (doc.createdAt) {
      messageDoc.updatedAt = doc.createdAt;
    }

    await Conversations.updateOne({ _id: message.conversationId }, { $set: messageDoc });

    graphqlPubsub.publish('conversationClientMessageInserted', {
      conversationClientMessageInserted: message,
    });

    graphqlPubsub.publish('conversationMessageInserted', {
      conversationMessageInserted: message,
    });

    return res.json({ _id: message._id });
  }

  if (action === 'external-integration-entry-added') {
    graphqlPubsub.publish('conversationExternalIntegrationMessageInserted');

    return res.json({ status: 'ok' });
  }
};

export default integrationsApiMiddleware;
