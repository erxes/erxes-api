import * as strip from 'strip';
import * as _ from 'underscore';
import { ConversationMessages, Conversations, Customers, Integrations } from '../../../db/models';
import { CONVERSATION_STATUSES, KIND_CHOICES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../../../db/models/definitions/conversations';
import { IMessengerData } from '../../../db/models/definitions/integrations';
import { IUserDocument } from '../../../db/models/definitions/users';
import { debugExternalApi } from '../../../debuggers';
import { graphqlPubsub } from '../../../pubsub';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import utils, { fetchIntegrationApi, getEnv } from '../../utils';

interface IConversationMessageAdd {
  conversationId: string;
  content: string;
  mentionedUserIds?: string[];
  internal?: boolean;
  attachments?: any;
}

/**
 * conversation notrification receiver ids
 */
export const conversationNotifReceivers = (
  conversation: IConversationDocument,
  currentUserId: string,
  exclude: boolean = true,
): string[] => {
  let userIds: string[] = [];

  // assigned user can get notifications
  if (conversation.assignedUserId) {
    userIds.push(conversation.assignedUserId);
  }

  // participated users can get notifications
  if (conversation.participatedUserIds) {
    userIds = _.union(userIds, conversation.participatedUserIds);
  }

  // exclude current user
  if (exclude) {
    userIds = _.without(userIds, currentUserId);
  }

  return userIds;
};

/**
 * Using this subscription to track conversation detail's assignee, tag, status
 * changes
 */
export const publishConversationsChanged = (_ids: string[], type: string): string[] => {
  for (const _id of _ids) {
    graphqlPubsub.publish('conversationChanged', {
      conversationChanged: { conversationId: _id, type },
    });
  }

  return _ids;
};

/**
 * Publish admin's message
 */
export const publishMessage = (message?: IMessageDocument | null, customerId?: string) => {
  if (!message) {
    return;
  }

  graphqlPubsub.publish('conversationMessageInserted', {
    conversationMessageInserted: message,
  });

  // widget is listening for this subscription to show notification
  // customerId available means trying to notify to client
  if (customerId) {
    const extendedMessage = message.toJSON();
    extendedMessage.customerId = customerId;

    graphqlPubsub.publish('conversationAdminMessageInserted', {
      conversationAdminMessageInserted: extendedMessage,
    });
  }
};

export const publishClientMessage = (message: IMessageDocument) => {
  // notifying to total unread count
  graphqlPubsub.publish('conversationClientMessageInserted', {
    conversationClientMessageInserted: message,
  });
};

const sendNotifications = async ({
  user,
  conversations,
  type,
  mobile,
  messageContent,
}: {
  user: IUserDocument;
  conversations: IConversationDocument[];
  type: string;
  mobile?: boolean;
  messageContent?: string;
}) => {
  for (const conversation of conversations) {
    const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN' });

    const doc = {
      createdUser: user,
      link: `${MAIN_APP_DOMAIN}/inbox/index?_id=${conversation._id}`,
      title: 'Conversation updated',
      content: '',
      notifType: type,
      receivers: conversationNotifReceivers(conversation, user._id),
    };

    switch (type) {
      case NOTIFICATION_TYPES.CONVERSATION_ADD_MESSAGE:
        doc.content = messageContent || '';
        doc.receivers = conversationNotifReceivers(conversation, user._id, false);
        break;
      case NOTIFICATION_TYPES.CONVERSATION_ASSIGNEE_CHANGE:
        doc.content = `has assigned you to conversation </br> ${conversation.content}`;
        break;
      case 'unassign':
        doc.notifType = NOTIFICATION_TYPES.CONVERSATION_ASSIGNEE_CHANGE;
        doc.content = `has removed you from conversation </br> ${conversation.content}`;
        break;
      case NOTIFICATION_TYPES.CONVERSATION_STATE_CHANGE:
        doc.content = `changed conversation status to ${(conversation.status || '').toUpperCase()} </br> ${
          conversation.content
        }`;
        break;
    }

    await utils.sendNotification(doc);

    if (mobile) {
      // send mobile notification ======
      await utils.sendMobileNotification({
        title: doc.title,
        body: strip(doc.content),
        receivers: conversationNotifReceivers(conversation, user._id, false),
        customerId: conversation.customerId,
      });
    }
  }
};

const conversationMutations = {
  /**
   * Create new message in conversation
   */
  async conversationMessageAdd(_root, doc: IConversationMessageAdd, { user }: { user: IUserDocument }) {
    const conversation = await Conversations.findOne({
      _id: doc.conversationId,
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const integration = await Integrations.findOne({
      _id: conversation.integrationId,
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    // do not send internal message to third service integrations
    if (doc.internal) {
      const messageObj = await ConversationMessages.addMessage(doc, user._id);

      // publish new message to conversation detail
      publishMessage(messageObj);

      return messageObj;
    }

    const kind = integration.kind;

    const customer = await Customers.findOne({ _id: conversation.customerId });

    // if conversation's integration kind is form then send reply to
    // customer's email
    const email = customer ? customer.primaryEmail : '';

    if (kind === KIND_CHOICES.FORM && email) {
      utils.sendEmail({
        toEmails: [email],
        title: 'Reply',
        template: {
          data: doc.content,
        },
      });
    }

    const message = await ConversationMessages.addMessage(doc, user._id);

    // send reply to facebook
    if (kind === KIND_CHOICES.FACEBOOK) {
      fetchIntegrationApi({
        path: '/facebook/reply',
        method: 'POST',
        body: {
          conversationId: conversation._id,
          integrationId: integration._id,
          content: strip(doc.content),
          attachments: doc.attachments || [],
        },
      })
        .then(response => {
          debugExternalApi(response);
        })
        .catch(e => {
          debugExternalApi(e.message);
        });
    }

    const dbMessage = await ConversationMessages.findOne({
      _id: message._id,
    });

    if (!dbMessage) {
      return;
    }

    await sendNotifications({
      user,
      conversations: [conversation],
      type: NOTIFICATION_TYPES.CONVERSATION_ADD_MESSAGE,
      mobile: true,
      messageContent: dbMessage.content || '',
    });

    // Publishing both admin & client
    publishMessage(dbMessage, conversation.customerId);

    return dbMessage;
  },

  /**
   * Assign employee to conversation
   */
  async conversationsAssign(
    _root,
    { conversationIds, assignedUserId }: { conversationIds: string[]; assignedUserId: string },
    { user }: { user: IUserDocument },
  ) {
    const conversations: IConversationDocument[] = await Conversations.assignUserConversation(
      conversationIds,
      assignedUserId,
    );

    // notify graphl subscription
    publishConversationsChanged(conversationIds, 'assigneeChanged');

    await sendNotifications({ user, conversations, type: NOTIFICATION_TYPES.CONVERSATION_ASSIGNEE_CHANGE });

    return conversations;
  },

  /**
   * Unassign employee from conversation
   */
  async conversationsUnassign(_root, { _ids }: { _ids: string[] }, { user }: { user: IUserDocument }) {
    const oldConversations = await Conversations.find({ _id: { $in: _ids } });
    const updatedConversations = await Conversations.unassignUserConversation(_ids);

    await sendNotifications({
      user,
      conversations: oldConversations,
      type: 'unassign',
    });

    // notify graphl subscription
    publishConversationsChanged(_ids, 'assigneeChanged');

    return updatedConversations;
  },

  /**
   * Change conversation status
   */
  async conversationsChangeStatus(
    _root,
    { _ids, status }: { _ids: string[]; status: string },
    { user }: { user: IUserDocument },
  ) {
    const { conversations } = await Conversations.checkExistanceConversations(_ids);

    await Conversations.changeStatusConversation(_ids, status, user._id);

    // notify graphl subscription
    publishConversationsChanged(_ids, status);

    for (const conversation of conversations) {
      if (status === CONVERSATION_STATUSES.CLOSED) {
        const customer = await Customers.findOne({
          _id: conversation.customerId,
        });

        if (!customer) {
          throw new Error('Customer not found');
        }

        const integration = await Integrations.findOne({
          _id: conversation.integrationId,
        });

        if (!integration) {
          throw new Error('Integration not found');
        }

        const messengerData: IMessengerData = integration.messengerData || {};
        const notifyCustomer = messengerData.notifyCustomer || false;

        if (notifyCustomer && customer.primaryEmail) {
          // send email to customer
          utils.sendEmail({
            toEmails: [customer.primaryEmail],
            title: 'Conversation detail',
            template: {
              name: 'conversationDetail',
              data: {
                conversationDetail: {
                  title: 'Conversation detail',
                  messages: await ConversationMessages.find({
                    conversationId: conversation._id,
                  }),
                  date: new Date(),
                },
              },
            },
          });
        }
      }
    }

    const updatedConversations = await Conversations.find({ _id: { $in: _ids } });

    await sendNotifications({
      user,
      conversations: updatedConversations,
      type: NOTIFICATION_TYPES.CONVERSATION_STATE_CHANGE,
    });

    return updatedConversations;
  },

  /**
   * Conversation mark as read
   */
  async conversationMarkAsRead(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    return Conversations.markAsReadConversation(_id, user._id);
  },
};

requireLogin(conversationMutations, 'conversationMarkAsRead');

checkPermission(conversationMutations, 'conversationMessageAdd', 'conversationMessageAdd');
checkPermission(conversationMutations, 'conversationsAssign', 'assignConversation');
checkPermission(conversationMutations, 'conversationsUnassign', 'assignConversation');
checkPermission(conversationMutations, 'conversationsChangeStatus', 'changeConversationStatus');

export default conversationMutations;
