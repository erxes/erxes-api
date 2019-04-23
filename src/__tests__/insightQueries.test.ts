import * as moment from 'moment';
import { CONVERSATION_STATUSES, TAG_TYPES } from '../data/constants';
import insightQueries from '../data/resolvers/queries/insights/insights';
import { graphqlRequest } from '../db/connection';
import {
  brandFactory,
  conversationFactory,
  conversationMessageFactory,
  integrationFactory,
  tagsFactory,
  userFactory,
} from '../db/factories';
import { Brands, ConversationMessages, Conversations, Integrations, Tags, Users } from '../db/models';

describe('insightQueries', () => {
  let doc;

  const paramsDef = `
    $integrationIds: String,
    $brandIds: String,
    $startDate: String,
    $endDate: String,
  `;

  const paramsValue = `
    integrationIds: $integrationIds,
    brandIds: $brandIds,
    startDate: $startDate,
    endDate: $endDate,
  `;

  const endDate = moment()
    .add(1, 'days')
    .format('YYYY-MM-DD HH:mm');

  const startDate = moment(endDate)
    .add(-7, 'days')
    .format('YYYY-MM-DD HH:mm');

  beforeEach(async () => {
    // Clearing test data
    const brand = await brandFactory();
    const tag = await tagsFactory({ type: TAG_TYPES.CONVERSATION });

    const integration = await integrationFactory({
      brandId: brand._id,
      kind: 'gmail',
    });

    const formIntegration = await integrationFactory({
      brandId: brand._id,
      kind: 'form',
    });

    const user = await userFactory({});

    doc = {
      integrationIds: 'gmail',
      brandIds: brand._id,
      startDate,
      endDate,
    };

    // conversation that is closed automatically (no conversation)
    await conversationFactory({
      status: CONVERSATION_STATUSES.CLOSED,
      integrationId: integration._id,
      closedAt: undefined,
      closedUserId: undefined,
    });

    // conversation that is a welcome message from engage (no conversation)
    await conversationFactory({ userId: user._id, messageCount: 1 });

    const formConversation = await conversationFactory({ integrationId: formIntegration._id });

    await conversationMessageFactory({ conversationId: formConversation._id, userId: null });

    const conversation = await conversationFactory({
      integrationId: integration._id,
      tagIds: [tag._id],
    });

    const closedConversation = await conversationFactory({
      integrationId: integration._id,
      firstRespondedUserId: user._id,
      firstRespondedDate: moment()
        .add(1, 'days')
        .toDate(),
      closedAt: moment()
        .add(2, 'days')
        .toDate(),
      closedUserId: user._id,
      status: 'closed',
      messageCount: 2,
      tagIds: [tag._id],
    });

    await conversationMessageFactory({ conversationId: conversation._id, userId: null });
    await conversationMessageFactory({ conversationId: conversation._id, userId: null });
    await conversationMessageFactory({ conversationId: closedConversation._id, userId: null });
    await conversationMessageFactory({ conversationId: closedConversation._id, userId: null });
  });

  afterEach(async () => {
    // Clearing test data
    await Tags.deleteMany({});
    await Users.deleteMany({});
    await Brands.deleteMany({});
    await Integrations.deleteMany({});
    await Conversations.deleteMany({});
    await ConversationMessages.deleteMany({});
  });

  test(`test if Error('Login required') exception is working as intended`, async () => {
    expect.assertions(8);

    const expectError = async func => {
      try {
        await func(null, {}, {});
      } catch (e) {
        expect(e.message).toBe('Login required');
      }
    };

    expectError(insightQueries.insightsTags);
    expectError(insightQueries.insightsIntegrations);
    expectError(insightQueries.insightsPunchCard);
    expectError(insightQueries.insightsTrend);
    expectError(insightQueries.insightsConversation);
    expectError(insightQueries.insightsSummaryData);
    expectError(insightQueries.insightsFirstResponse);
    expectError(insightQueries.insightsResponseClose);
  });

  test('insightsIntegrations', async () => {
    const qry = `
      query insightsIntegrations(${paramsDef}) {
          insightsIntegrations(${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsIntegrations', doc);
    expect(response[1].value).toEqual(1);
    expect(response[5].value).toEqual(2);
  });

  test('insightsTags', async () => {
    const qry = `
      query insightsTags(${paramsDef}) {
          insightsTags(${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsTags', doc);
    expect(response[0].value).toEqual(2);
  });

  test('insightsPunchCard', async () => {
    const qry = `
      query insightsPunchCard($type: String, ${paramsDef}) {
        insightsPunchCard(type: $type, ${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsPunchCard', doc);
    expect(response.length).toBe(1);
    expect(response[0].count).toBe(4);
  });

  test('insightsConversation', async () => {
    const qry = `
      query insightsConversation(${paramsDef}) {
        insightsConversation(${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsConversation', doc);

    expect(response.trend[0].y).toBe(2);
  });

  test('insightsFirstResponse', async () => {
    const qry = `
      query insightsFirstResponse(${paramsDef}) {
        insightsFirstResponse(${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsFirstResponse', doc);

    expect(response.trend[0].y).toBe(1);
    expect(response.teamMembers.length).toBe(1);
    expect(response.summaries[3]).toBe(1);
  });

  test('insightsResponseClose', async () => {
    const qry = `
      query insightsResponseClose(${paramsDef}) {
        insightsResponseClose(${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsResponseClose', doc);
    expect(response.trend.length).toBe(1);
    expect(response.teamMembers.length).toBe(1);
  });

  test('insightsSummaryData', async () => {
    const qry = `
      query insightsSummaryData($type: String, ${paramsDef}) {
          insightsSummaryData(type: $type, ${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsSummaryData', doc);

    expect(response[0]).toBe(4); // In time range
    expect(response[1]).toBe(4); // This month
    expect(response[2]).toBe(4); // This week
    expect(response[3]).toBe(4); // Today
    expect(response[4]).toBe(4); // Last 30 days
  });

  test('insightsTrend', async () => {
    const qry = `
      query insightsTrend($type: String, ${paramsDef}) {
          insightsTrend(type: $type, ${paramsValue})
      }
    `;

    const response = await graphqlRequest(qry, 'insightsTrend', doc);

    expect(response.length).toBe(1);
    expect(response[0].y).toBe(4);
  });
});
