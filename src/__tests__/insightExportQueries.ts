import * as moment from 'moment';
import insightExportQueries from '../data/resolvers/queries/insights/insightExport';
import { graphqlRequest } from '../db/connection';
import { brandFactory, conversationFactory, conversationMessageFactory, integrationFactory } from '../db/factories';
import { Brands, ConversationMessages, Conversations, Integrations } from '../db/models';

describe('insightExportQueries', () => {
  let brand;
  let integration;
  let conversation;

  const endDate = moment()
    .add(1, 'days')
    .format('YYYY-MM-DD HH:mm');

  const startDate = moment(endDate)
    .add(-7, 'days')
    .format('YYYY-MM-DD HH:mm');

  beforeEach(async () => {
    process.env.DOMAIN = 'http://localhost:3000';
    // Clearing test data
    brand = await brandFactory();
    integration = await integrationFactory({
      brandId: brand._id,
      kind: 'gmail',
    });
    conversation = await conversationFactory({
      integrationId: integration._id,
    });

    await conversationFactory({
      integrationId: integration._id,
    });
    await conversationMessageFactory({
      conversationId: conversation._id,
      userId: null,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Brands.deleteMany({});
    await Integrations.deleteMany({});
    await Conversations.deleteMany({});
    await ConversationMessages.deleteMany({});
  });

  test(`test if Error('Login required') exception is working as intended`, async () => {
    expect.assertions(4);

    const expectError = async func => {
      try {
        await func(null, {}, {});
      } catch (e) {
        expect(e.message).toBe('Login required');
      }
    };

    expectError(insightExportQueries.insightVolumeReportExport);
    expectError(insightExportQueries.insightActivityReportExport);
    expectError(insightExportQueries.insightFirstResponseReportExport);
    expectError(insightExportQueries.insightTagReportExport);
  });

  test('insightVolumeReportExport', async () => {
    const args = {
      integrationIds: 'gmail',
      brandIds: brand._id,
      startDate,
      endDate,
    };

    const qry = `
      query insightVolumeReportExport(
        $type: String,
        $integrationIds: String,
        $brandIds: String,
        $startDate: String,
        $endDate: String
        ) {
        insightVolumeReportExport(
          type: $type,
          integrationIds: $integrationIds,
          brandIds: $brandIds,
          startDate: $startDate,
          endDate: $endDate
        )
      }
    `;

    const DOMAIN = process.env.DOMAIN;
    const response = await graphqlRequest(qry, 'insightVolumeReportExport', args);
    expect(response).toBe(
      `${DOMAIN}/static/xlsTemplateOutputs/Volume report By date - ${dateToString(startDate)} - ${dateToString(
        endDate,
      )}.xlsx`,
    );
  });

  test('insightActivityReportExport', async () => {
    const args = {
      integrationIds: 'gmail',
      brandIds: brand._id,
      startDate,
      endDate,
    };

    const qry = `
      query insightActivityReportExport(
        $integrationIds: String,
        $brandIds: String,
        $startDate: String,
        $endDate: String
        ) {
        insightActivityReportExport(
          integrationIds: $integrationIds,
          brandIds: $brandIds,
          startDate: $startDate,
          endDate: $endDate
        )
      }
    `;

    const DOMAIN = process.env.DOMAIN;
    const response = await graphqlRequest(qry, 'insightActivityReportExport', args);
    expect(response).toBe(
      `${DOMAIN}/static/xlsTemplateOutputs/Operator Activity report - ${dateToString(startDate)} - ${dateToString(
        endDate,
      )}.xlsx`,
    );
  });

  test('insightFirstResponseReportExport', async () => {
    const args = {
      integrationIds: integration._id,
      brandIds: brand._id,
      startDate,
      endDate,
    };

    const qry = `
      query insightFirstResponseReportExport(
        $integrationIds: String,
        $brandIds: String,
        $startDate: String,
        $endDate: String
        ) {
        insightFirstResponseReportExport(
          integrationIds: $integrationIds,
          brandIds: $brandIds,
          startDate: $startDate,
          endDate: $endDate
        )
      }
    `;

    const DOMAIN = process.env.DOMAIN;
    const response = await graphqlRequest(qry, 'insightFirstResponseReportExport', args);
    expect(response).toBe(`${DOMAIN}/static/xlsTemplateOutputs/First Response - ${startDate} - ${endDate}.xlsx`);
  });

  test('insightTagReportExport', async () => {
    const args = {
      integrationIds: 'gmail',
      brandIds: brand._id,
      startDate,
      endDate,
    };

    const qry = `
      query insightTagReportExport(
        $integrationIds: String,
        $brandIds: String,
        $startDate: String,
        $endDate: String
        ) {
        insightTagReportExport(
          integrationIds: $integrationIds,
          brandIds: $brandIds,
          startDate: $startDate,
          endDate: $endDate
        )
      }
    `;

    const DOMAIN = process.env.DOMAIN;
    const response = await graphqlRequest(qry, 'insightTagReportExport', args);
    expect(response).toBe(`${DOMAIN}/static/xlsTemplateOutputs/Tag report - ${startDate} - ${endDate}.xlsx`);
  });
});
