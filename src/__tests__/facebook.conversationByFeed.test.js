/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import sinon from 'sinon';
import { assert } from 'chai';
import { connect, disconnect } from '../db/connection';
import { CONVERSATION_STATUSES } from '../data/constants';
import { Conversations, ConversationMessages } from '../db/models';
import { facebookIntegrationFactory } from '../db/factories';
import { graphRequest, SaveWebhookResponse } from '../data/integrations/facebook';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('facebook integration: get or create conversation by feed info', () => {
  let _stub;

  afterEach(() => {
    graphRequest.get.restore(); // unwraps the spy
  });

  beforeEach(async () => {
    // clear
    await Conversations.remove({});
    await ConversationMessages.remove({});

    // mock all requests
    const sandbox = sinon.sandbox.create();

    _stub = sandbox.stub(graphRequest, 'get').callsFake(path => {
      if (path.includes('/?fields=access_token')) {
        return {
          access_token: '244242442442',
        };
      }

      return {};
    });
  });

  it('admin posts', async () => {
    const senderId = 'DFDFDEREREEFFFD';
    const postId = 'DFJDFJDIF';

    // indicating sender is our admins, in other words posting from our page
    const pageId = senderId;

    const integration = await facebookIntegrationFactory({
      facebookData: {
        appId: '242424242422',
        pageIds: [pageId, 'DFDFDFDFDFD'],
      },
    });

    const saveWebhookResponse = new SaveWebhookResponse('access_token', integration);

    saveWebhookResponse.currentPageId = 'DFDFDFDFDFD';

    // must be 0 conversations
    assert.equal(await Conversations.find().count(), 0);

    saveWebhookResponse.getOrCreateConversationByFeed({
      verb: 'add',
      sender_id: senderId,
      post_id: postId,
      message: 'hi all',
    });

    assert.equal(await Conversations.find().count(), 1); // 1 conversation

    const conversation = Conversations.findOne();

    // our posts will be closed automatically
    assert.equal(conversation.status, CONVERSATION_STATUSES.CLOSED);
  });
});
