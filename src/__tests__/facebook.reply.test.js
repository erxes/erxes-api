/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import sinon from 'sinon';
import { assert } from 'chai';
import { connect, disconnect } from '../db/connection';
import { FACEBOOK_DATA_KINDS } from '../data/constants';
import { graphRequest, facebookReply } from '../data/integrations/facebook';
import { Conversations, Integrations, ConversationMessages } from '../db/models';
import { conversationFactory, facebookIntegrationFactory } from '../db/factories';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('facebook integration: reply', () => {
  const pageId = '2252525525';
  const senderId = 2242424244;
  const postId = 'postId';
  let _sandbox;
  let _integration;

  beforeAll(async () => {
    // create integration
    _integration = await facebookIntegrationFactory({
      facebookData: {
        appId: 'id',
        pageIds: [pageId],
      },
    });

    _sandbox = sinon.sandbox.create();

    _sandbox.stub(graphRequest, 'get').callsFake(() => ({
      access_token: 'page_access_token',
    }));
  });

  afterAll(async () => {
    await Integrations.remove();

    graphRequest.get.restore();
  });

  describe('messenger', () => {
    let _postStub;
    let _conversation;

    beforeAll(async () => {
      _postStub = _sandbox.stub(graphRequest, 'post').callsFake(() => {});

      _conversation = await conversationFactory({
        integrationId: _integration._id,
        facebookData: {
          kind: FACEBOOK_DATA_KINDS.MESSENGER,
          pageId,
          senderId,
        },
      });
    });

    afterAll(async () => {
      await Conversations.remove({});
      await ConversationMessages.remove();

      // unwraps the spy
      graphRequest.post.restore();
    });

    it('messenger', async () => {
      const text = 'to messenger';

      // reply
      await facebookReply({ conversation: _conversation, text });

      // check
      assert.equal(_postStub.calledWith('me/messages', 'page_access_token'), true);
    });
  });

  describe('feed', async () => {
    let _conversation;
    let _gpStub;
    let _mongoStub;

    beforeAll(async () => {
      _conversation = await conversationFactory({
        integrationId: _integration._id,
        facebookData: {
          kind: FACEBOOK_DATA_KINDS.FEED,
          senderId,
          pageId,
          postId,
        },
      });

      // mock post messenger reply
      _gpStub = sinon.stub(graphRequest, 'post').callsFake(() => ({
        id: 'commentId',
      }));

      // mock message update
      _mongoStub = sinon.stub(ConversationMessages, 'update').callsFake(() => {});
    });

    afterAll(async () => {
      // unwrap stub
      ConversationMessages.update.restore();
      graphRequest.post.restore();

      await Conversations.remove();
    });

    it('feed', async () => {
      const text = 'comment';
      const messageId = '242424242';

      // reply
      await facebookReply({
        conversation: _conversation,
        text,
        messageId,
        accessToken: 'access token',
      });

      // check graph request
      assert.equal(_gpStub.calledWith('postId/comments', 'page_access_token'), true);

      // check mongo update
      assert.equal(
        _mongoStub.calledWith(
          { _id: messageId },
          { $set: { 'facebookData.commentId': 'commentId' } },
        ),
        true,
      );
    });
  });
});
