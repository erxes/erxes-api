import graph from 'fbgraph';
import { CONVERSATION_STATUSES, FACEBOOK_DATA_KINDS } from '../constants';
import { Conversations, ConversationMessages, Customers } from '../../db/models';

/*
 * Common graph api request wrapper
 * catchs auth token or other type of exceptions
 */
export const graphRequest = {
  base(method, path, accessToken, ...otherParams) {
    // set access token
    graph.setAccessToken(accessToken);

    try {
      return graph[method](path, ...otherParams);
      // catch session expired or some other error
    } catch (e) {
      console.log(e.message); // eslint-disable-line no-console
      return e.message;
    }
  },

  get(...args) {
    return this.base('get', ...args);
  },

  post(...args) {
    return this.base('post', ...args);
  },
};

/*
 * save webhook response
 * create conversation, customer, message using transmitted data
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
          return;
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

  // via page messenger
  async viaMessengerEvent(entry) {
    for (let messagingEvent of entry.messaging) {
      // someone sent us a message
      if (messagingEvent.message) {
        await this.getOrCreateConversationByMessenger(messagingEvent);
      }
    }
  }

  // wall post
  async viaFeedEvent(entry) {
    for (let event of entry.changes) {
      // someone posted on our wall
      await this.getOrCreateConversationByFeed(event.value);
    }
  }

  // common get or create conversation helper using both in messenger and feed
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
    });

    // create new conversation
    if (!conversation) {
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
      // update conversation
      await Conversations.update(
        { _id: conversation._id },
        {
          $set: {
            // reset read history
            readUserIds: [],

            // if closed, reopen it
            status: CONVERSATION_STATUSES.OPEN,
          },
        },
      );
    }

    // create new message
    await this.createMessage({
      conversation,
      userId: senderId,
      content,
      attachments,
      facebookData: msgFacebookData,
    });

    return conversation;
  }

  // get or create new conversation by feed info
  async getOrCreateConversationByFeed(value) {
    const commentId = value.comment_id;

    // collect only added actions
    if (value.verb !== 'add') {
      return;
    }

    // ignore duplicated action when like
    if (value.verb === 'add' && value.item === 'like') {
      return;
    }

    // if this is already saved then ignore it
    const message = await ConversationMessages.findOne({ 'facebookData.commentId': commentId });
    if (commentId && message) {
      return;
    }

    const senderName = value.sender_name;

    // sender_id is giving number values when feed and giving string value
    // when messenger. customer.facebookData.senderId has type of string so
    // convert it to string
    const senderId = value.sender_id.toString();

    let messageText = value.message;

    // when photo, video share, there will be no text, so link instead
    if (!messageText && value.link) {
      messageText = value.link;
    }

    // when situations like checkin, there will be no text and no link
    // if so ignore it
    if (!messageText) {
      return;
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
      return;
    }

    // get post object
    response = graphRequest.get(postId, response.access_token);

    postId = response.id;

    let status = CONVERSATION_STATUSES.NEW;

    // if we are posting from our page, close it automatically
    if (this.integration.facebookData.pageIds.includes(senderId)) {
      status = CONVERSATION_STATUSES.CLOSED;
    }

    return this.getOrCreateConversation({
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
        item: value.item,
        reactionType: value.reaction_type,
        photoId: value.photo_id,
        videoId: value.video_id,
        link: value.link,
      },
    });
  }

  // get or create new conversation by page messenger
  getOrCreateConversationByMessenger(event) {
    const senderId = event.sender.id;
    const senderName = event.sender.name;
    const recipientId = event.recipient.id;
    const messageText = event.message.text || 'attachment';

    // collect attachment's url, type fields
    const attachments = (event.message.attachments || []).map(attachment => ({
      type: attachment.type,
      url: attachment.payload ? attachment.payload.url : '',
    }));

    return this.getOrCreateConversation({
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
      msgFacebookData: {},
    });
  }

  // get or create customer using facebook data
  async getOrCreateCustomer(fbUserId) {
    const integrationId = this.integration._id;

    let customer = await Customers.findOne({
      integrationId,
      'facebookData.id': fbUserId,
    });

    if (customer) {
      return customer._id;
    }

    // get page access token
    let res = graphRequest.get(`${this.currentPageId}/?fields=access_token`, this.userAccessToken);

    // get user info
    res = graphRequest.get(`/${fbUserId}`, res.access_token);

    // when feed response will contain name field
    // when messeger response will not contain name field
    const name = res.name || `${res.first_name} ${res.last_name}`;

    // create customer
    customer = await Customers.createCustomer({
      name,
      integrationId,
      facebookData: {
        id: fbUserId,
        profilePic: res.profile_pic,
      },
    });

    return customer._id;
  }

  async createMessage({ conversation, userId, content, attachments, facebookData }) {
    if (conversation) {
      // create new message
      const message = await ConversationMessages.createMessage({
        conversationId: conversation._id,
        customerId: await this.getOrCreateCustomer(userId),
        content,
        attachments,
        facebookData,
        internal: false,
      });

      // TODO: notify subscription server new message

      return message;
    }
  }
}

/*
 * post reply to page conversation or comment to wall post
 */
export const facebookReply = async ({ conversation, text, messageId, accessToken }) => {
  // page access token
  const response = await graphRequest.get(
    `${conversation.facebookData.pageId}/?fields=access_token`,
    accessToken,
  );

  // messenger reply
  if (conversation.facebookData.kind === FACEBOOK_DATA_KINDS.MESSENGER) {
    return await graphRequest.post(
      'me/messages',
      response.access_token,
      {
        recipient: { id: conversation.facebookData.senderId },
        message: { text },
      },
      () => {},
    );
  }

  // feed reply
  if (conversation.facebookData.kind === FACEBOOK_DATA_KINDS.FEED) {
    const postId = conversation.facebookData.postId;

    // post reply
    const commentResponse = await graphRequest.post(`${postId}/comments`, response.access_token, {
      message: text,
    });

    // save commentId in message object
    await ConversationMessages.update(
      { _id: messageId },
      { $set: { 'facebookData.commentId': commentResponse.id } },
    );
  }

  return null;
};
