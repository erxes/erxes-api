import {
  ActivityLogs,
  Integrations,
  Conversations,
  ConversationMessages,
  Customers,
} from '../db/models';

import { publishMessage } from '../data/resolvers/mutations/conversations';

import {
  INTEGRATION_KIND_CHOICES,
  CONVERSATION_STATUSES,
  FACEBOOK_DATA_KINDS,
} from '../data/constants';

import { graphRequest } from './facebookTracker';

/*
 * Get list of pages that authorized user owns
 * @param {String} accessToken - App access token
 * @return {[Object]} - page list
 */
export const getPageList = async accessToken => {
  const response = await graphRequest.get('/me/accounts?limit=100', accessToken);

  return response.data.map(page => ({
    id: page.id,
    name: page.name,
  }));
};

/*
 * Save webhook response
 * create conversation, customer, message using transmitted data
 *
 * @param {String} userAccessToken - User access token
 * @param {Object} integration - Integration object
 * @param {Object} data - Facebook webhook response
 */

export class SaveWebhookResponse {
  constructor(userAccessToken, integration, data) {
    this.userAccessToken = userAccessToken;

    this.integration = integration;

    // received facebook data
    this.data = data;

    this.currentPageId = null;
  }

  async start() {
    const data = this.data;
    const integration = this.integration;

    if (data.object === 'page') {
      for (let entry of data.entry) {
        // check receiving page is in integration's page list
        if (!integration.facebookData.pageIds.includes(entry.id)) {
          return null;
        }

        // set current page
        this.currentPageId = entry.id;

        // receive new messenger message
        if (entry.messaging) {
          await this.viaMessengerEvent(entry);
        }

        // receive new feed
        if (entry.changes) {
          await this.viaFeedEvent(entry);
        }
      }
    }
  }

  /*
  * Via page messenger
  */
  async viaMessengerEvent(entry) {
    for (let messagingEvent of entry.messaging) {
      // someone sent us a message
      if (messagingEvent.message) {
        await this.getOrCreateConversationByMessenger(messagingEvent);
      }
    }
  }

  /*
   * Wall post
   */
  async viaFeedEvent(entry) {
    for (let event of entry.changes) {
      // someone posted on our wall
      await this.getOrCreateConversationByFeed(event.value);
    }
  }

  /*
   * Common get or create conversation helper using both in messenger and feed
   * @param {Object} params - Parameters doc
   * @return newly create message object
   */
  async getOrCreateConversation(params) {
    // extract params
    const {
      findSelector,
      status,
      senderId,
      facebookData,
      content,
      attachments,
      msgFacebookData,
    } = params;

    let conversation = await Conversations.findOne({
      ...findSelector,
    }).sort({ createdAt: -1 });

    // We are closing our own posts automatically below. So to prevent
    // from creation of new conversation for every comment we are checking
    // both message count & conversation status to new conversation.
    // And we are creating new conversations only if previous conversation has
    // at least 2 messages and has closed status.
    if (
      !conversation ||
      (conversation.messageCount > 1 && conversation.status === CONVERSATION_STATUSES.CLOSED)
    ) {
      conversation = await Conversations.createConversation({
        integrationId: this.integration._id,
        customerId: await this.getOrCreateCustomer(senderId),
        status,
        content,

        // save facebook infos
        facebookData: {
          ...facebookData,
          pageId: this.currentPageId,
        },
      });
    } else {
      conversation = await Conversations.reopen(conversation._id);
    }

    // create new message
    return this.createMessage({
      conversation,
      userId: senderId,
      content,
      attachments,
      facebookData: msgFacebookData,
    });
  }

  /*
   * Get or create new conversation by feed info
   * @param {Object} value - Webhook response item
   */
  async getOrCreateConversationByFeed(value) {
    const commentId = value.comment_id;

    // collect only added actions
    if (value.verb !== 'add') {
      return null;
    }

    // ignore duplicated action when like
    if (value.verb === 'add' && value.item === 'like') {
      return null;
    }

    // if this is already saved then ignore it
    if (
      commentId &&
      (await ConversationMessages.findOne({ 'facebookData.commentId': commentId }))
    ) {
      return null;
    }

    const senderName = value.from.name;

    // sender_id is giving number values when feed and giving string value
    // when messenger. customer.facebookData.senderId has type of string so
    // convert it to string
    const senderId = value.from.id.toString();

    let messageText = value.message;

    // when photo, video share, there will be no text, so link instead
    if (!messageText && value.link) {
      messageText = value.link;
    }

    // when situations like checkin, there will be no text and no link
    // if so ignore it
    if (!messageText) {
      return null;
    }

    // value.post_id is returning different value even though same post
    // with the previous one. So fetch post info via graph api and
    // save returned value. This value will always be the same
    let postId = value.post_id;

    // get page access token
    let response = await graphRequest.get(
      `${this.currentPageId}/?fields=access_token`,
      this.userAccessToken,
    );

    // acess token expired
    if (response === 'Error processing https request') {
      return null;
    }

    // get post object
    response = await graphRequest.get(postId, response.access_token);

    postId = response.id;

    let status = CONVERSATION_STATUSES.NEW;

    // if we are posting from our page, close it automatically
    if (this.integration.facebookData.pageIds.includes(senderId)) {
      status = CONVERSATION_STATUSES.CLOSED;
    }

    await this.getOrCreateConversation({
      findSelector: {
        'facebookData.kind': FACEBOOK_DATA_KINDS.FEED,
        'facebookData.postId': postId,
      },
      status,
      senderId,
      facebookData: {
        kind: FACEBOOK_DATA_KINDS.FEED,
        senderId,
        senderName,
        postId,
      },

      // message data
      content: messageText,
      msgFacebookData: {
        senderId,
        senderName,
        commentId: value.comment_id,
        parentId: value.parent_id,
        postId,
        item: value.item,
        reactionType: value.reaction_type,
        photoId: value.photo_id,
        videoId: value.video_id,
        link: value.link,
      },
    });
  }

  /*
   * Get or create new conversation by page messenger
   * @param {Object} event - Webhook response item
   * @return Newly created message object
   */
  async getOrCreateConversationByMessenger(event) {
    const senderId = event.sender.id;
    const senderName = event.sender.name;
    const recipientId = event.recipient.id;
    const messageId = event.message.mid;
    const messageText = event.message.text || 'attachment';

    // collect attachment's url, type fields
    const attachments = (event.message.attachments || []).map(attachment => ({
      type: attachment.type,
      url: attachment.payload ? attachment.payload.url : '',
    }));

    // if this is already saved then ignore it
    if (await ConversationMessages.findOne({ 'facebookData.messageId': messageId })) {
      return null;
    }

    await this.getOrCreateConversation({
      // try to find conversation by senderId, recipientId keys
      findSelector: {
        'facebookData.kind': FACEBOOK_DATA_KINDS.MESSENGER,
        $or: [
          {
            'facebookData.senderId': senderId,
            'facebookData.recipientId': recipientId,
          },
          {
            'facebookData.senderId': recipientId,
            'facebookData.recipientId': senderId,
          },
        ],
      },
      status: CONVERSATION_STATUSES.NEW,
      senderId,
      facebookData: {
        kind: FACEBOOK_DATA_KINDS.MESSENGER,
        senderId,
        senderName,
        recipientId,
      },

      // message data
      content: messageText,
      attachments,
      msgFacebookData: {
        messageId,
      },
    });
  }

  /*
   * Get or create customer using facebook data
   * @param {String} fbUserId - Facebook user id
   * @return Previous or newly created customer object
   */
  async getOrCreateCustomer(fbUserId) {
    const integrationId = this.integration._id;

    const customer = await Customers.findOne({ 'facebookData.id': fbUserId });

    if (customer) {
      return customer._id;
    }

    // get page access token
    let res = await graphRequest.get(
      `${this.currentPageId}/?fields=access_token`,
      this.userAccessToken,
    );

    // get user info
    res = await graphRequest.get(`/${fbUserId}`, res.access_token);

    // get profile pic
    const getProfilePic = async fbId => {
      try {
        const response = await graphRequest.get(`/${fbId}/picture?height=600`);
        return response.image ? response.location : '';
      } catch (e) {
        return null;
      }
    };

    // when feed response will contain name field
    // when messeger response will not contain name field
    const firstName = res.first_name || res.name;
    const lastName = res.last_name || '';

    // create customer
    const createdCustomer = await Customers.createCustomer({
      firstName,
      lastName,
      integrationId,
      facebookData: {
        id: fbUserId,
        profilePic: res.profile_pic || (await getProfilePic(fbUserId)),
      },
    });

    // create log
    await ActivityLogs.createCustomerRegistrationLog(createdCustomer);

    return createdCustomer;
  }

  /*
   * Create new message
   */
  async createMessage({ conversation, userId, content, attachments, facebookData }) {
    if (conversation) {
      // create new message
      const messageId = await ConversationMessages.createMessage({
        conversationId: conversation._id,
        customerId: await this.getOrCreateCustomer(userId),
        content,
        attachments,
        facebookData,
        internal: false,
      });

      // updating conversation content
      await Conversations.update({ _id: conversation._id }, { $set: { content } });

      // notify subscription server new message
      const message = await ConversationMessages.findOne({ _id: messageId });

      publishMessage(message);

      return messageId;
    }
  }
}

/*
 * Receive per app webhook response
 * @param {Object} app - Apps configuration item from .env
 * @param {Object} data - Webhook response
 */
export const receiveWebhookResponse = async (app, data) => {
  const selector = {
    kind: INTEGRATION_KIND_CHOICES.FACEBOOK,
    'facebookData.appId': app.id,
  };

  const integrations = await Integrations.find(selector);

  for (let integration of integrations) {
    // when new message or other kind of activity in page
    const saveWebhookResponse = new SaveWebhookResponse(app.accessToken, integration, data);

    await saveWebhookResponse.start();
  }
};

/**
 * Post reply to page conversation or comment to wall post
 * @param {Object} conversation - Conversation object
 * @param {Object} msg - Reply content
 * @param {Sting} msg.text - Reply content
 * @param {Sting} msg.attachment - Reply content
 * @param {String} messageId - Conversation message id
 */
export const facebookReply = async (conversation, msg, messageId) => {
  const { attachments = [], text } = msg;
  const FACEBOOK_APPS = getConfig();

  const doc = {};

  const integration = await Integrations.findOne({
    _id: conversation.integrationId,
  });

  const app = FACEBOOK_APPS.find(a => a.id === integration.facebookData.appId);

  // page access token
  const response = await graphRequest.get(
    `${conversation.facebookData.pageId}/?fields=access_token`,
    app.accessToken,
  );

  // messenger reply
  if (conversation.facebookData.kind === FACEBOOK_DATA_KINDS.MESSENGER) {
    doc.message = { text };

    if (attachments.length > 0) {
      doc.source = attachments[0].url;
    }

    await graphRequest
      .post('me/messages', response.access_token, {
        recipient: { id: conversation.facebookData.senderId },
        ...doc,
      })
      .then(async response => {
        // save commentId in message object
        await ConversationMessages.update(
          { _id: messageId },
          { $set: { 'facebookData.messageId': response.message_id } },
        );
      })
      .catch(e => {
        return e.message;
      });
  }

  // feed reply
  if (conversation.facebookData.kind === FACEBOOK_DATA_KINDS.FEED) {
    const postId = conversation.facebookData.postId;
    doc.message = text;

    if (attachments.length > 0) {
      doc.attachment_url = attachments[0].url;
    }

    // post reply
    await graphRequest
      .post(`${postId}/comments`, response.access_token, {
        ...doc,
      })
      .then(async response => {
        // save commentId in message object
        await ConversationMessages.update(
          { _id: messageId },
          { $set: { 'facebookData.commentId': response.id } },
        );
      })
      .catch(e => {
        return e.message;
      });
  }

  return null;
};

export const getConfig = () => {
  const { FACEBOOK } = process.env;

  return JSON.parse(FACEBOOK);
};
