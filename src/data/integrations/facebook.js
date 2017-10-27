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

  start() {
    const data = this.data;
    const integration = this.integration;

    if (data.object === 'page') {
      data.entry.forEach(entry => {
        // check receiving page is in integration's page list
        if (!integration.facebookData.pageIds.includes(entry.id)) {
          return;
        }

        // set current page
        this.currentPageId = entry.id;

        // receive new messenger message
        if (entry.messaging) {
          this.viaMessengerEvent(entry);
        }

        // receive new feed
        if (entry.changes) {
          this.viaFeedEvent(entry);
        }
      });
    }
  }

  // via page messenger
  viaMessengerEvent(entry) {
    entry.messaging.forEach(messagingEvent => {
      // someone sent us a message
      if (messagingEvent.message) {
        this.getOrCreateConversationByMessenger(messagingEvent);
      }
    });
  }

  // wall post
  viaFeedEvent(entry) {
    entry.changes.forEach(event => {
      // someone posted on our wall
      this.getOrCreateConversationByFeed(event.value);
    });
  }

  // common get or create conversation helper using both in messenger and feed
  async getOrCreateConversation(params) {
    console.log('this.getOrCreateConversation');
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

    console.log('aaaaaa');
    console.log('findSelector: ', findSelector);
    let conversation = await Conversations.findOne({
      ...findSelector,
    });

    console.log('bbbbbb');
    // create new conversation
    if (!conversation) {
      console.log('cccccc');
      conversation = await Conversations.createConversation({
        integrationId: this.integration._id,
        customerId: this.getOrCreateCustomer(senderId),
        status,
        content,

        // save facebook infos
        facebookData: {
          ...facebookData,
          pageId: this.currentPageId,
        },
      });
    } else {
      console.log('ccc');
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

    console.log('ddd');
    // create new message
    this.createMessage({
      conversation,
      userId: senderId,
      content,
      attachments,
      facebookData: msgFacebookData,
    });
  }

  // get or create new conversation by feed info
  async getOrCreateConversationByFeed(value) {
    const commentId = value.comment_id;

    // collect only added actions
    if (value.verb !== 'add') {
      console.log(`value.verb !== 'add'`);
      return;
    }

    // ignore duplicated action when like
    if (value.verb === 'add' && value.item === 'like') {
      console.log(`value.verb === 'add' && value.item === 'like'`);
      return;
    }

    // if this is already saved then ignore it
    const message = await ConversationMessages.findOne({ 'facebookData.commentId': commentId });
    if (commentId && message) {
      console.log('commentId && message');
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
      console.log('!messageText');
      return;
    }

    // value.post_id is returning different value even though same post
    // with the previous one. So fetch post info via graph api and
    // save returned value. This value will always be the same
    let postId = value.post_id;

    console.log('aaa');
    // get page access token
    let response = await graphRequest.get(
      `${this.currentPageId}/?fields=access_token`,
      this.userAccessToken,
    );
    console.log('bbb');

    // acess token expired
    if (response === 'Error processing https request') {
      console.log('Error processing https request');
      return;
    }

    // get post object
    response = await graphRequest.get(postId, response.access_token);

    postId = response.id;

    let status = CONVERSATION_STATUSES.NEW;

    // if we are posting from our page, close it automatically
    if (this.integration.facebookData.pageIds.includes(senderId)) {
      status = CONVERSATION_STATUSES.CLOSED;
    }

    console.log('here');
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
        item: value.item,
        reactionType: value.reaction_type,
        photoId: value.photo_id,
        videoId: value.video_id,
        link: value.link,
      },
    });
    console.log('fff');
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

    this.getOrCreateConversation({
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
        customerId: this.getOrCreateCustomer(userId),
        content,
        attachments,
        facebookData,
        internal: false,
      });

      // TODO: notify subscription server new message

      return message._id;
    }
  }
}
