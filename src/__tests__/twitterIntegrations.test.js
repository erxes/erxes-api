/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import Twit from 'twit';
import sinon from 'sinon';
import { assert } from 'chai';
import { connect, disconnect } from '../db/connection';
import { integrationFactory, conversationFactory } from '../db/factories';
import { CONVERSATION_STATUSES } from '../data/constants';
import { Conversations, ConversationMessages, Customers, Integrations } from '../db/models';
import {
  TwitMap,
  getOrCreateCommonConversation,
  tweetReply,
  getOrCreateDirectMessageConversation,
} from '../data/integrations/twitter';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('twitter integration', () => {
  describe('get or create conversation', () => {
    let _integration;

    const twitterUser = {
      id: 2442424242,
      id_str: '2442424242',
      name: 'username',
      screen_name: 'screen name',
      profile_image_url: 'profile_image_url',
    };

    beforeEach(async () => {
      _integration = await integrationFactory();
    });

    afterEach(async () => {
      await Integrations.remove({});
      await Conversations.remove({});
      await ConversationMessages.remove({});
      await Customers.remove({});
    });

    test('common', async () => {
      const tweetId = 2424244244;

      // create conversation
      await conversationFactory({
        integrationId: _integration._id,
        status: CONVERSATION_STATUSES.NEW,
        twitterData: {
          id: tweetId,
          isDirectMessage: false,
        },
      });

      // replying to old tweet
      await getOrCreateCommonConversation(
        {
          in_reply_to_status_id: tweetId,
          user: twitterUser,
        },
        _integration,
      );

      // must not created new conversation
      expect(await Conversations.find().count()).toEqual(1);

      const conversation = await Conversations.findOne({});

      // status must updated as open
      expect(conversation.status).toEqual(CONVERSATION_STATUSES.OPEN);
    });

    it('direct message', async () => {
      const senderId = 2424424242;
      const recipientId = 92442424424242;

      // create conversation
      await conversationFactory({
        integrationId: _integration._id,
        twitterData: {
          isDirectMessage: true,
          directMessage: {
            senderId,
            senderIdStr: senderId.toString(),
            recipientId,
            recipientIdStr: recipientId.toString(),
          },
        },
      });

      // direct message
      await getOrCreateDirectMessageConversation(
        {
          id: 42242242,
          id_str: '42242242',
          screen_name: 'screen_name',
          sender_id: senderId,
          sender_id_str: senderId.toString(),
          recipient_id: recipientId,
          recipient_id_str: recipientId.toString(),
          sender: twitterUser,
        },
        _integration,
      );

      // must not created new conversation
      assert.equal(await Conversations.find().count(), 1);

      const conversation = await Conversations.findOne({});

      // status must updated as open
      assert.equal(conversation.status, CONVERSATION_STATUSES.OPEN);
    });
  });

  describe('reply', () => {
    let _integration;
    let twit;
    let stub;

    beforeEach(async () => {
      const sandbox = sinon.sandbox.create();

      // create integration
      _integration = await integrationFactory({});

      // Twit instance
      twit = new Twit({
        consumer_key: 'consumer_key',
        consumer_secret: 'consumer_secret',
        access_token: 'access_token',
        access_token_secret: 'token_secret',
      });

      // save twit instance
      TwitMap[_integration._id] = twit;

      // twit.post
      stub = sandbox.stub(twit, 'post').callsFake(() => {});
    });

    afterEach(async () => {
      // unwrap the spy
      twit.post.restore();
      await Conversations.remove({});
      await Integrations.remove({});
      await ConversationMessages.remove({});
      await Customers.remove({});
    });

    it('direct message', async () => {
      const text = 'reply';
      const senderId = 242424242;

      const conversation = await conversationFactory({
        integrationId: _integration._id,
        twitterData: {
          isDirectMessage: true,
          directMessage: {
            senderId,
            senderIdStr: senderId.toString(),
            recipientId: 535335353,
            recipientIdStr: '535335353',
          },
        },
      });

      // action
      await tweetReply(conversation, text);

      // check twit post params
      assert.equal(
        stub.calledWith('direct_messages/new', {
          user_id: senderId.toString(),
          text,
        }),
        true,
      );
    });

    it('tweet', async () => {
      const text = 'reply';
      const tweetIdStr = '242424242';
      const screenName = 'test';

      const conversation = await conversationFactory({
        integrationId: _integration._id,
        twitterData: {
          isDirectMessage: false,
          idStr: tweetIdStr,
          screenName,
        },
      });

      // action
      await tweetReply(conversation, text);

      // check twit post params
      assert.equal(
        stub.calledWith('statuses/update', {
          status: `@${screenName} ${text}`,

          // replying tweet id
          in_reply_to_status_id: tweetIdStr,
        }),
        true,
      );
    });
  });

  describe('tweet', () => {
    let _integration;

    beforeEach(async () => {
      // create integration
      _integration = await integrationFactory({});
    });

    afterEach(async () => {
      await Conversations.remove({});
      await Integrations.remove({});
      await ConversationMessages.remove({});
      await Customers.remove({});
    });

    it('mention', async () => {
      let tweetText = '@test hi';
      const tweetId = 242424242424;
      const tweetIdStr = '242424242424';
      const screenName = 'screen_name';
      const userName = 'username';
      const profileImageUrl = 'profile_image_url';
      const twitterUserId = 24242424242;
      const twitterUserIdStr = '24242424242';

      // regular tweet
      const data = {
        text: tweetText,
        // tweeted user's info
        user: {
          id: twitterUserId,
          id_str: twitterUserIdStr,
          name: userName,
          screen_name: screenName,
          profile_image_url: profileImageUrl,
        },

        // tweet id
        id: tweetId,
        id_str: tweetIdStr,
      };

      // call action
      await getOrCreateCommonConversation(data, _integration);

      assert.equal(await Conversations.find().count(), 1); // 1 conversation
      assert.equal(await Customers.find().count(), 1); // 1 customer
      assert.equal(await ConversationMessages.find().count(), 1); // 1 message

      let conversation = await Conversations.findOne();
      const customer = await Customers.findOne();
      const message = await ConversationMessages.findOne();

      // check conversation field values
      assert.equal(conversation.integrationId, _integration._id);
      assert.equal(conversation.customerId, customer._id);
      assert.equal(conversation.status, CONVERSATION_STATUSES.NEW);
      assert.equal(conversation.content, tweetText);
      assert.equal(conversation.twitterData.id, tweetId);
      assert.equal(conversation.twitterData.idStr, tweetIdStr);
      assert.equal(conversation.twitterData.screenName, screenName);
      assert.equal(conversation.twitterData.isDirectMessage, false);

      // check customer field values
      assert.equal(customer.integrationId, _integration._id);
      assert.equal(customer.twitterData.id, twitterUserId);
      assert.equal(customer.twitterData.idStr, twitterUserIdStr);
      assert.equal(customer.twitterData.name, userName);
      assert.equal(customer.twitterData.screenName, screenName);
      assert.equal(customer.twitterData.profileImageUrl, profileImageUrl);

      // check message field values
      assert.equal(message.conversationId, conversation._id);
      assert.equal(message.customerId, customer._id);
      assert.equal(message.internal, false);
      assert.equal(message.content, tweetText);

      // tweet reply ===============
      tweetText = 'reply';
      const newTweetId = 2442442424;

      data.text = tweetText;
      data.in_reply_to_status_id = tweetId;
      data.id = newTweetId;
      data.idStr = newTweetId.toString();

      // call action
      await getOrCreateCommonConversation(data, _integration);

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
      assert.equal(newMessage.content, tweetText);
    });

    it('direct message', async () => {
      // direct message
      const data = {
        id: 33324242424242,
        id_str: '33324242424242',
        text: 'direct message',
        sender_id: 24242424242,
        sender_id_str: '24242424242',
        recipient_id: 343424242424242,
        recipient_id_str: '343424242424242',
        sender: {
          id: 24242424242,
          id_str: '24242424242',
          name: 'username',
          screen_name: 'screen_name',
          profile_image_url: 'profile_image_url',
        },
      };

      // call action
      await getOrCreateDirectMessageConversation(data, _integration);

      assert.equal(await Conversations.find().count(), 1); // 1 conversation
      assert.equal(await Customers.find().count(), 1); // 1 customer
      assert.equal(await ConversationMessages.find().count(), 1); // 1 message

      let conv = await Conversations.findOne();
      const customer = await Customers.findOne();
      const message = await ConversationMessages.findOne();

      // check conv field values
      assert.equal(conv.integrationId, _integration._id);
      assert.equal(conv.customerId, customer._id);
      assert.equal(conv.status, CONVERSATION_STATUSES.NEW);
      assert.equal(conv.content, data.text);
      assert.equal(conv.twitterData.id, data.id);
      assert.equal(conv.twitterData.idStr, data.id_str);
      assert.equal(conv.twitterData.screenName, data.sender.screen_name);
      assert.equal(conv.twitterData.isDirectMessage, true);
      assert.equal(conv.twitterData.directMessage.senderId, data.sender_id);
      assert.equal(conv.twitterData.directMessage.senderIdStr, data.sender_id_str);
      assert.equal(conv.twitterData.directMessage.recipientId, data.recipient_id);
      assert.equal(conv.twitterData.directMessage.recipientIdStr, data.recipient_id_str);

      // check customer field values
      assert.equal(customer.integrationId, _integration._id);
      assert.equal(customer.twitterData.id, data.sender_id);
      assert.equal(customer.twitterData.idStr, data.sender_id_str);
      assert.equal(customer.twitterData.name, data.sender.name);
      assert.equal(customer.twitterData.screenName, data.sender.screen_name);
      assert.equal(customer.twitterData.profileImageUrl, data.sender.profile_image_url);

      // check message field values
      assert.equal(message.conversationId, conv._id);
      assert.equal(message.customerId, customer._id);
      assert.equal(message.internal, false);
      assert.equal(message.content, data.text);

      // tweet reply ===============
      data.text = 'reply';
      data.id = 3434343434;

      // call action
      await getOrCreateDirectMessageConversation(data, _integration);

      // must not be created new conversation
      assert.equal(await Conversations.find().count(), 1);

      // must not be created new customer
      assert.equal(await Customers.find().count(), 1);

      // must be created new message
      assert.equal(await ConversationMessages.find().count(), 2);

      // check conversation field updates
      conv = await Conversations.findOne();
      assert.equal(conv.readUserIds.length, 0);

      const newMessage = await ConversationMessages.findOne({ _id: { $ne: message._id } });

      // check message fields
      assert.equal(newMessage.content, data.text);
    });
  });
});
