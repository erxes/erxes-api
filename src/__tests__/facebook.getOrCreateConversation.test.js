/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import sinon from 'sinon';
import { assert } from 'chai';
import { connect, disconnect } from '../db/connection';
import { CONVERSATION_STATUSES, FACEBOOK_DATA_KINDS } from '../data/constants';
import { graphRequest, SaveWebhookResponse } from '../data/integrations/facebook';
import { Conversations, ConversationMessages } from '../db/models';
import { customerFactory, integrationFactory } from '../db/factories';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('facebook integration: get or create conversation', () => {
  const senderId = 2242424244;
  const pageId = '2252525525';
  let customer;
  let integration;
  let saveWebhookResponse;

  beforeEach(async () => {
    customer = await customerFactory({});
    integration = await integrationFactory({});

    const sandbox = sinon.sandbox.create();

    saveWebhookResponse = new SaveWebhookResponse('access_token', integration, {});

    sandbox.stub(graphRequest, 'get').callsFake(() => {});
    sandbox.stub(saveWebhookResponse, 'getOrCreateCustomer').callsFake(() => customer._id);
  });

  afterEach(async () => {
    graphRequest.get.restore(); // unwraps the spy
    saveWebhookResponse.getOrCreateCustomer.restore();

    await Conversations.remove({});
    await ConversationMessages.remove({});
  });

  it('get or create conversation', async () => {
    const postId = '32242442442';
    saveWebhookResponse.currentPageId = pageId;

    // check initial states
    assert.equal(await Conversations.find().count(), 0);
    assert.equal(await ConversationMessages.find().count(), 0);

    const facebookData = {
      kind: FACEBOOK_DATA_KINDS.FEED,
      senderId,
      postId,
    };

    const filter = {
      'facebookData.kind': FACEBOOK_DATA_KINDS.FEED,
      'facebookData.postId': postId,
    };

    // customer said hi ======================
    let conversation = await saveWebhookResponse.getOrCreateConversation({
      findSelector: filter,
      status: CONVERSATION_STATUSES.NEW,
      senderId,
      facebookData,
      content: 'hi',
    });

    // must be created new conversation, new message
    assert.equal(await Conversations.find().count(), 1);
    assert.equal(await ConversationMessages.find().count(), 1);
    assert.equal(conversation.status, CONVERSATION_STATUSES.NEW);

    // customer commented on above converstaion ===========
    await saveWebhookResponse.getOrCreateConversation({
      findSelector: filter,
      status: CONVERSATION_STATUSES.NEW,
      senderId,
      facebookData,
      content: 'hey',
    });

    // must not be created new conversation, new message
    assert.equal(await Conversations.find().count(), 1);
    assert.equal(await ConversationMessages.find().count(), 2);

    // close converstaion
    await Conversations.update({}, { $set: { status: CONVERSATION_STATUSES.CLOSED } });

    // customer commented on closed converstaion ===========
    conversation = await saveWebhookResponse.getOrCreateConversation({
      findSelector: filter,
      status: CONVERSATION_STATUSES.NEW,
      senderId,
      facebookData,
      conntet: 'hi again',
    });

    // must not be created new conversation, new message
    assert.equal(await Conversations.find().count(), 1);

    // must be opened
    conversation = await Conversations.findOne({ _id: conversation._id });
    assert.equal(conversation.status, CONVERSATION_STATUSES.OPEN);
    assert.equal(await ConversationMessages.find().count(), 3);

    // new post ===========
    filter.postId = '34424242444242';

    await saveWebhookResponse.getOrCreateConversation({
      findSelector: filter,
      status: CONVERSATION_STATUSES.NEW,
      senderId,
      facebookData,
      content: 'new sender hi',
    });

    // must be created new conversation, new message
    assert.equal(await Conversations.find().count(), 2);
    assert.equal(await ConversationMessages.find().count(), 4);
  });
});
