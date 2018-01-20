/* eslint-env jest */

import sinon from 'sinon';
import { connect, disconnect } from '../../db/connection';
import { getPageList, receiveWebhookResponse, updateReactions } from '../../social/facebook';
import { graphRequest } from '../../social/facebookTracker';
import { Integrations, ConversationMessages } from '../../db/models';
import { integrationFactory, conversationMessageFactory } from '../../db/factories';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('facebook integration common tests', () => {
  const pages = [{ id: '1', name: 'page1' }];

  afterEach(async () => {
    // clear
    await Integrations.remove({});
    await ConversationMessages.remove({});
  });

  test('receive web hook response', async () => {
    const app = { id: 1 };

    await integrationFactory({ kind: 'facebook', facebookData: { appId: app.id } });

    await receiveWebhookResponse(app, {});
  });

  test('get page list', async () => {
    sinon.stub(graphRequest, 'get').callsFake(() => ({ data: pages }));

    expect(await getPageList()).toEqual(pages);

    graphRequest.get.restore(); // unwraps the spy
  });

  test('graph request', async () => {
    sinon.stub(graphRequest, 'base').callsFake(() => {});

    await graphRequest.get();
    await graphRequest.post();

    graphRequest.base.restore(); // unwraps the spy
  });

  test('post comment update reactions', async () => {
    const commentId = 'facebookComment';
    let message = await conversationMessageFactory({
      facebookData: {
        commentId,
      },
    });

    const reactionType = 'haha';
    const customerId = 'customer._id';

    const result = await updateReactions({
      reactions: message.facebookData.reactions,
      type: reactionType,
      customerId,
    });

    await ConversationMessages.update(
      { 'facebookData.commentId': commentId },
      {
        $set: { 'facebookData.reactions': result },
      },
    );

    message = await ConversationMessages.findOne({
      'facebookData.commentId': commentId,
    });

    const fbData = message.facebookData;
    expect(fbData.reactions[reactionType].length).toBe(1);
    expect(fbData.reactions[reactionType][0]).toBe(customerId);

    const newType = 'wow';
    const changeResult = await updateReactions({
      reactions: fbData.reactions,
      type: newType,
      customerId,
    });

    expect(changeResult[reactionType].length).toBe(0);
    expect(changeResult[newType].length).toBe(1);
    expect(changeResult[newType][0]).toBe(customerId);
  });
});
