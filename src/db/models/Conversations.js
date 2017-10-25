import strip from 'strip';

import mongoose from 'mongoose';
import Random from 'meteor-random';
import { CONVERSATION_STATUSES, FACEBOOK_DATA_KINDS } from '../../data/constants';

import { Users } from '../../db/models';

const TwitterDirectMessageSchema = mongoose.Schema(
  {
    senderId: {
      type: Number,
    },
    senderIdStr: {
      type: String,
    },
    recipientId: {
      type: Number,
    },
    recipientIdStr: {
      type: String,
    },
  },
  { _id: false },
);

// Twitter schema
const TwitterSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      required: false,
    },
    idStr: {
      type: String,
    },
    screenName: {
      type: String,
    },
    isDirectMessage: {
      type: Boolean,
    },
    directMessage: {
      type: TwitterDirectMessageSchema,
    },
  },
  { _id: false },
);

// facebook schema
const FacebookSchema = mongoose.Schema(
  {
    kind: {
      type: String,
      enum: FACEBOOK_DATA_KINDS.ALL_LIST,
    },
    senderName: {
      type: String,
    },
    senderId: {
      type: String,
    },
    recipientId: {
      type: String,
    },

    // when wall post
    postId: {
      type: String,
    },

    pageId: {
      type: String,
    },
  },
  { _id: false },
);

// Conversation schema
const ConversationSchema = mongoose.Schema({
  _id: { type: String, unique: true, default: () => Random.id() },
  content: String,
  integrationId: {
    type: String,
    required: true,
  },
  customerId: String,
  userId: String,
  assignedUserId: String,
  participatedUserIds: [String],
  readUserIds: [String],
  createdAt: Date,
  status: {
    type: String,
    required: true,
    enum: CONVERSATION_STATUSES.ALL_LIST,
  },
  messageCount: Number,
  tagIds: [String],

  // number of total conversations
  number: Number,
  twitterData: TwitterSchema,
  facebookData: FacebookSchema,
});

class Conversation {
  /**
   * Check conversations exists
   * @param  {list} ids of conversations
   * @return {object, list} selector, conversations
   */
  static async checkExistanceConversations(_ids) {
    const selector = { _id: { $in: _ids } };
    const conversations = await this.find(selector);

    if (conversations.length !== _ids.length) {
      throw new Error('Conversation not found.');
    }

    return { selector, conversations };
  }

  /**
   * Create a conversation
   * @param  {Object} conversationObj object
   * @return {Promise} Newly created conversation object
   */
  static async createConversation(doc) {
    return this.create({
      ...doc,
      status: CONVERSATION_STATUSES.NEW,
      createdAt: new Date(),
      number: (await this.find().count()) + 1,
      messageCount: 0,
    });
  }

  /**
   * Assign user to conversation
   * @param  {list} conversationIds
   * @param  {String} assignedUserId
   * @return {Promise} Updated conversation objects
   */
  static async assignUserConversation(conversationIds, assignedUserId) {
    await this.checkExistanceConversations(conversationIds);

    if (!await Users.findOne({ _id: assignedUserId })) {
      throw new Error(`User not found with id ${assignedUserId}`);
    }

    await this.update(
      { _id: { $in: conversationIds } },
      { $set: { assignedUserId } },
      { multi: true },
    );

    return this.find({ _id: { $in: conversationIds } });
  }

  /**
   * Unassign user from conversation
   * @param  {list} conversationIds
   * @return {Promise} Updated conversation objects
   */
  static async unassignUserConversation(conversationIds) {
    await this.checkExistanceConversations(conversationIds);

    await this.update(
      { _id: { $in: conversationIds } },
      { $unset: { assignedUserId: 1 } },
      { multi: true },
    );

    return this.find({ _id: { $in: conversationIds } });
  }

  /**
   * Change conversation status
   * @param  {list} conversationIds
   * @param  {String} status
   * @return {Promise} Updated conversation id
   */
  static changeStatusConversation(conversationIds, status) {
    return this.update({ _id: { $in: conversationIds } }, { $set: { status } }, { multi: true });
  }

  /**
   * Star conversation
   * @param  {list} _ids of conversations
   * @param  {String} userId
   * @return {Promise} updated user object
   */
  static async starConversation(_ids, userId) {
    await this.checkExistanceConversations(_ids);

    await Users.update(
      { _id: userId },
      {
        $addToSet: {
          'details.starredConversationIds': { $each: _ids },
        },
      },
    );

    return Users.findOne({ _id: userId });
  }

  /**
   * Unstar conversation
   * @param  {list} _ids of conversations
   * @param  {string} userId
   * @return {Promise} updated user object
   */
  static async unstarConversation(_ids, userId) {
    // check conversations existance
    await this.checkExistanceConversations(_ids);

    await Users.update(
      { _id: userId },
      {
        $pull: {
          'details.starredConversationIds': { $in: _ids },
        },
      },
    );

    return Users.findOne({ _id: userId });
  }

  /**
   * Add participated user to conversation
   * @param  {list} _ids
   * @param  {String} userId
   * @param  {Boolean} toggle - add only if true
   * @return {Promise} Updated conversation list
   */
  static async toggleParticipatedUsers(_ids, userId) {
    const { selector } = await this.checkExistanceConversations(_ids);

    const extendSelector = {
      ...selector,
      participatedUserIds: { $in: [userId] },
    };

    // not previously added
    if ((await this.find(extendSelector).count()) === 0) {
      await this.update(
        { _id: { $in: _ids } },
        { $addToSet: { participatedUserIds: userId } },
        { multi: true },
      );
    } else {
      // remove
      await this.update(
        { _id: { $in: _ids } },
        { $pull: { participatedUserIds: { $in: [userId] } } },
        { multi: true },
      );
    }
    return this.find({ _id: { $in: _ids } });
  }

  /**
   * Mark as read conversation
   * @param  {String} _id of conversation
   * @param  {String} userId
   * @return {Promise} Updated conversation object
   */
  static async markAsReadConversation(_id, userId) {
    const conversation = await this.findOne({ _id });

    if (!conversation) throw new Error(`Conversation not found with id ${_id}`);

    const readUserIds = conversation.readUserIds;

    // if current user is first one
    if (!readUserIds || readUserIds.length === 0) {
      await this.update({ _id }, { $set: { readUserIds: [userId] } });
    }

    // if current user is not in read users list then add it
    if (!readUserIds.includes(userId)) {
      await this.update({ _id }, { $push: { readUserIds: userId } });
    }

    return this.findOne({ _id });
  }

  /**
   * Get new or open conversation
   * @return {Promise} conversations
   */
  static newOrOpenConversation() {
    return this.find({
      status: { $in: [CONVERSATION_STATUSES.NEW, CONVERSATION_STATUSES.OPEN] },
    });
  }

  /**
   * Add participated user
   * @param {String} conversationId
   * @param {String} userId
   * @return {Promise} updated conversation id
   */
  static addParticipatedUsers(conversationId, userId) {
    if (conversationId && userId) {
      return this.update(
        { _id: conversationId },
        {
          $addToSet: { participatedUserIds: userId },
        },
      );
    }
  }

  /**
   * Update conversation
   * @param {string} _id - Id of conversation document
   * @param {Conversation} doc - Conversation document/object
   * @return {Promise} returns Promise resolving Conversation document
   */
  static async updateConversation(_id, doc) {
    await this.update({ _id }, { $set: doc });

    return this.findOne({ _id });
  }
}

ConversationSchema.loadClass(Conversation);
export const Conversations = mongoose.model('conversations', ConversationSchema);

const MessageSchema = mongoose.Schema({
  _id: { type: String, unique: true, default: () => Random.id() },
  content: String,
  attachments: Object,
  mentionedUserIds: [String],
  conversationId: String,
  internal: Boolean,
  customerId: String,
  userId: String,
  createdAt: Date,
  isCustomerRead: Boolean,
  engageData: Object,
  formWidgetData: Object,
  facebookData: FacebookSchema,
});

class Message {
  /**
   * Create a message
   * @param  {Object} messageObj object
   * @return {Promise} Newly created message object
   */
  static async createMessage(doc) {
    const message = await this.create({
      ...doc,
      createdAt: new Date(),
    });

    const messageCount = await this.find({
      conversationId: message.conversationId,
    }).count();

    await Conversations.update({ _id: message.conversationId }, { $set: { messageCount } });

    // add created user to participators
    await Conversations.addParticipatedUsers(message.conversationId, message.userId);

    // add mentioned users to participators
    for (let userId of message.mentionedUserIds) {
      await Conversations.addParticipatedUsers(message.conversationId, userId);
    }

    return message;
  }

  /**
   * Create a conversation
   * @param  {Object} doc - conversation message fields
   * @param  {Object} user object
   * @return {Promise} Newly created conversation object
   */
  static async addMessage(doc, userId) {
    const conversation = await Conversations.findOne({ _id: doc.conversationId });

    if (!conversation) throw new Error(`Conversation not found with id ${doc.conversationId}`);

    // normalize content, attachments
    const content = doc.content || '';
    const attachments = doc.attachments || [];

    doc.content = content;
    doc.attachments = attachments;

    // if there is no attachments and no content then throw content required error
    if (attachments.length === 0 && !strip(content)) throw new Error('Content is required');

    // setting conversation's content to last message
    await this.update({ _id: doc.conversationId }, { $set: { content } });

    return this.createMessage({ ...doc, userId });
  }

  /**
   * Remove a messages
   * @param  {Object} selector
   * @return {Promise} Deleted messages info
   */
  static async removeMessages(selector) {
    const messages = await this.find(selector);
    const result = await this.remove(selector);

    for (let message of messages) {
      const messageCount = await Messages.find({
        conversationId: message.conversationId,
      }).count();

      await Conversations.update({ _id: message.conversationId }, { $set: { messageCount } });
    }

    return result;
  }

  /**
  * User's last non answered question
  * @param  {String} conversationId
  * @return {Promise} message object
  */
  static getNonAsnweredMessage(conversationId) {
    return this.findOne({
      conversationId: conversationId,
      customerId: { $exists: true },
    }).sort({ createdAt: -1 });
  }

  /**
   * Get admin messages
   * @param  {String} conversationId
   * @return {Promise} messages
   */
  static getAdminMessages(conversationId) {
    return this.find({
      conversationId: conversationId,
      userId: { $exists: true },
      isCustomerRead: false,

      // exclude internal notes
      internal: false,
    }).sort({ createdAt: 1 });
  }

  /**
   * Mark sent messages as read
   * @param  {String} conversationId
   * @return {Promise} updated messages info
   */
  static markSentAsReadMessages(conversationId) {
    return this.update(
      {
        conversationId: conversationId,
        userId: { $exists: true },
        isCustomerRead: { $exists: false },
      },
      { $set: { isCustomerRead: true } },
      { multi: true },
    );
  }
}

MessageSchema.loadClass(Message);

export const Messages = mongoose.model('conversation_messages', MessageSchema);
