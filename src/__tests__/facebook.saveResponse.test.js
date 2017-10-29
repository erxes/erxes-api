/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import sinon from 'sinon';
import { assert } from 'chai';
import { connect, disconnect } from '../db/connection';
import { CONVERSATION_STATUSES, FACEBOOK_DATA_KINDS } from '../data/constants';
import { Conversations, ConversationMessages, Customers } from '../db/models';
import { graphRequest, SaveWebhookResponse } from '../data/integrations/facebook';
import { facebookIntegrationFactory } from '../db/factories';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('facebook integration: save webhook response', () => {
  let senderId = 2242424244;
  const pageId = '2252525525';
  const postId = '242422242424244';
  const recipientId = '242422242424244';

  let saveWebhookResponse;
  let integration;

  afterAll(() => {
    graphRequest.get.restore(); // unwraps the spy
  });

  beforeAll(async () => {
    const sandbox = sinon.sandbox.create();
    integration = await facebookIntegrationFactory({
      facebookData: {
        appId: '242424242422',
        pageIds: [pageId],
      },
    });

    sandbox.stub(graphRequest, 'get').callsFake(path => {
      // mock get page access token
      if (path.includes('/?fields=access_token')) {
        return {
          access_token: '244242442442',
        };
      }

      // mock get post object
      if (path === postId) {
        return {
          id: postId,
        };
      }

      // mock get user info
      return {
        name: 'Dombo Gombo',
      };
    });

    saveWebhookResponse = new SaveWebhookResponse('access_token', integration, {});
  });

  afterEach(async () => {
    await Conversations.remove({});
    await ConversationMessages.remove({});
    await Customers.remove({});
  });

  beforeEach(() => {});

  it('via messenger event', async () => {
    // first time ========================

    assert.equal(await Conversations.find().count(), 0); // 0 conversations
    assert.equal(await Customers.find().count(), 0); // 0 customers
    assert.equal(await ConversationMessages.find().count(), 0); // 0 messages

    senderId = '2242424244';
    let messageText = 'from messenger';

    const attachments = [
      {
        type: 'image',
        payload: {
          url: 'attachment_url',
        },
      },
    ];

    // customer says from messenger via messenger
    saveWebhookResponse.data = {
      object: 'page',
      entry: [
        {
          id: pageId,
          messaging: [
            {
              sender: { id: senderId },
              recipient: { id: recipientId },
              message: {
                text: messageText,
                attachments,
              },
            },
          ],
        },
      ],
    };

    await saveWebhookResponse.start();

    assert.equal(await Conversations.find().count(), 1); // 1 conversation
    assert.equal(await ConversationMessages.find().count(), 1); // 1 message
    assert.equal(await Customers.find().count(), 1); // 1 customer

    let conversation = await Conversations.findOne();
    const customer = await Customers.findOne();
    const message = await ConversationMessages.findOne();

    // check conversation field values
    assert.equal(conversation.integrationId, integration._id);
    assert.equal(conversation.customerId, customer._id);
    assert.equal(conversation.status, CONVERSATION_STATUSES.NEW);
    assert.equal(conversation.content, messageText);
    assert.equal(conversation.facebookData.kind, FACEBOOK_DATA_KINDS.MESSENGER);
    assert.equal(conversation.facebookData.senderId, senderId);
    assert.equal(conversation.facebookData.recipientId, recipientId);
    assert.equal(conversation.facebookData.pageId, pageId);

    // check customer field values
    assert.equal(customer.integrationId, integration._id);
    assert.equal(customer.name, 'Dombo Gombo'); // from mocked get info above
    assert.equal(customer.facebookData.id, senderId);

    // check message field values
    assert.equal(message.conversationId, conversation._id);
    assert.equal(message.customerId, customer._id);
    assert.equal(message.internal, false);
    assert.equal(message.content, messageText);
    assert.deepEqual(message.attachments, [{ type: 'image', url: 'attachment_url' }]);

    // second time ========================

    // customer says hi via messenger again
    messageText = 'hi';

    saveWebhookResponse.data = {
      object: 'page',
      entry: [
        {
          id: pageId,
          messaging: [
            {
              sender: { id: senderId },
              recipient: { id: recipientId },

              message: {
                text: messageText,
              },
            },
          ],
        },
      ],
    };

    await saveWebhookResponse.start();

    // must not be created new conversation
    assert.equal(await Conversations.find().count(), 1);

    // must not be created new customer
    assert.equal(await Customers.find().count(), 1);

    // must be created new message
    assert.equal(await ConversationMessages.find().count(), 2);

    // check conversation field updates
    conversation = await Conversations.findOne();
    assert.equal(conversation.readUserIds.length, 0);

    const newMessage = await ConversationMessages.findOne({ _id: { $ne: message._id } });

    // check message fields
    assert.equal(newMessage.conversationId, conversation._id);
    assert.equal(newMessage.customerId, customer._id);
    assert.equal(newMessage.internal, false);
    assert.equal(newMessage.content, messageText);
  });

  it('via feed event', async () => {
    // first time ========================

    assert.equal(await Conversations.find().count(), 0); // 0 conversations
    assert.equal(await Customers.find().count(), 0); // 0 customers
    assert.equal(await ConversationMessages.find().count(), 0); // 0 messages

    let messageText = 'wall post';
    const link = 'link_url';
    const commentId = '2424242422242424244';

    // customer posted `wall post` on our wall
    saveWebhookResponse.data = {
      object: 'page',
      entry: [
        {
          id: pageId,
          changes: [
            {
              value: {
                verb: 'add',
                item: 'post',
                post_id: postId,
                comment_id: commentId,
                sender_id: senderId,
                message: messageText,
                link,
              },
            },
          ],
        },
      ],
    };

    await saveWebhookResponse.start();

    assert.equal(await Conversations.find().count(), 1); // 1 conversation
    assert.equal(await Customers.find().count(), 1); // 1 customer
    assert.equal(await ConversationMessages.find().count(), 1); // 1 message

    let conversation = await Conversations.findOne();
    const customer = await Customers.findOne();
    const message = await ConversationMessages.findOne();

    // check conversation field values
    assert.equal(conversation.integrationId, integration._id);
    assert.equal(conversation.customerId, customer._id);
    assert.equal(conversation.status, CONVERSATION_STATUSES.NEW);
    assert.equal(conversation.content, messageText);
    assert.equal(conversation.facebookData.kind, FACEBOOK_DATA_KINDS.FEED);
    assert.equal(conversation.facebookData.postId, postId);
    assert.equal(conversation.facebookData.pageId, pageId);

    // check customer field values
    assert.equal(customer.integrationId, integration._id);
    assert.equal(customer.name, 'Dombo Gombo'); // from mocked get info above
    assert.equal(customer.facebookData.id, senderId);

    // check message field values
    assert.equal(message.conversationId, conversation._id);
    assert.equal(message.customerId, customer._id);
    assert.equal(message.internal, false);
    assert.equal(message.content, messageText);
    assert.equal(message.facebookData.item, 'post');
    assert.equal(message.facebookData.senderId, senderId);
    assert.equal(message.facebookData.link, link);

    // second time ========================

    // customer commented hi on above post again
    messageText = 'hi';

    saveWebhookResponse.data = {
      object: 'page',
      entry: [
        {
          id: pageId,
          changes: [
            {
              value: {
                verb: 'add',
                item: 'comment',
                reaction_type: 'haha',
                post_id: postId,
                comment_id: commentId,
                sender_id: senderId,
                message: messageText,
              },
            },
          ],
        },
      ],
    };

    await saveWebhookResponse.start();

    // must not be created new conversation
    assert.equal(await Conversations.find().count(), 1);

    // must not be created new customer
    assert.equal(await Customers.find().count(), 1);

    // must be created new message
    assert.equal(await ConversationMessages.find().count(), 2);

    // check conversation field updates
    conversation = await Conversations.findOne();
    assert.equal(conversation.readUserIds.length, 0);

    const newMessage = await ConversationMessages.findOne({ _id: { $ne: message._id } });

    // check message fields
    assert.equal(newMessage.conversationId, conversation._id);
    assert.equal(newMessage.customerId, customer._id);
    assert.equal(newMessage.internal, false);
    assert.equal(newMessage.content, messageText);
    assert.equal(newMessage.attachments, null);

    assert.equal(newMessage.facebookData.item, 'comment');
    assert.equal(newMessage.facebookData.senderId, senderId);
    assert.equal(newMessage.facebookData.reactionType, 'haha');
  });
});
