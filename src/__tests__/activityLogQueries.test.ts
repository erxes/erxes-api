import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import {
  activityLogFactory,
  brandFactory,
  dealFactory,
  growthHackFactory,
  integrationFactory,
  taskFactory,
  ticketFactory,
  userFactory,
} from '../db/factories';
import { ActivityLogs, Users } from '../db/models';

import './setup.ts';

describe('activityLogQueries', () => {
  let user;
  let brand;
  let integration;
  let deal;
  let ticket;
  let growtHack;
  let task;

  const commonParamDefs = `
    $contentType: String!,
    $contentId: String!,
    $activityType: String,
    $limit: Int,
  `;

  const commonParams = `
    contentType: $contentType
    contentId: $contentId
    activityType: $activityType
    limit: $limit
  `;

  const qryActivityLogs = `
    query activityLogs(${commonParamDefs}) {
      activityLogs(${commonParams}) {
        _id
        action
        contentId
        contentType
        content
        createdAt
        createdBy
    
        createdByDetail
        contentDetail
        contentTypeDetail
      }
    }
  `;

  beforeEach(async () => {
    user = await userFactory();
    brand = await brandFactory();
    integration = await integrationFactory({
      brandId: brand._id,
    });
    deal = await dealFactory();
    ticket = await ticketFactory();
    growtHack = await growthHackFactory();
    task = await taskFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await ActivityLogs.deleteMany({});
    await Users.deleteMany({});
  });

  test('Activity log', async () => {
    const contentId = faker.random.uuid();
    const contentType = 'customer';

    await activityLogFactory({ contentId, contentType });
    await activityLogFactory({ contentId, contentType });
    await activityLogFactory({ contentId, contentType });

    const args = { contentId, contentType };

    const response = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

    expect(response.length).toBe(3);
  });

  test('Activity log with created by user', async () => {
    const contentId = faker.random.uuid();
    const contentType = 'customer';
    const createdBy = user._id;

    const doc = {
      contentId,
      contentType,
      createdBy,
    };

    await activityLogFactory(doc);

    const args = { contentId, contentType };

    const response = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

    expect(response.length).toBe(1);
  });

  test('Activity log with created by user', async () => {
    const contentId = faker.random.uuid();
    const contentType = 'customer';
    const createdBy = user._id;

    const doc = {
      contentId,
      contentType,
      createdBy,
    };

    await activityLogFactory(doc);

    const args = { contentId, contentType };

    const response = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

    expect(response.length).toBe(1);
  });

  test('Activity log with created by integration', async () => {
    const contentId = faker.random.uuid();
    const contentType = 'customer';
    const createdBy = integration._id;

    const doc = {
      contentId,
      contentType,
      createdBy,
    };

    await activityLogFactory(doc);

    const args = { contentId, contentType };

    const response = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

    expect(response.length).toBe(1);
  });

  test('Activity log contentType', async () => {
    const contentType = 'deal';
    const createdBy = integration._id;

    const types = [
      { type: 'deal', content: deal },
      { type: 'ticket', content: ticket },
      { type: 'task', content: task },
      { type: 'growtHack', content: growtHack },
    ];

    for (const type of types) {
      const doc = {
        action: 'merge',
        contentId: type.content._id,
        contentType: type.type,
        createdBy,
      };

      await activityLogFactory(doc);

      const args = { contentId: type.content._id, contentType };

      const response = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

      expect(response.length).toBe(1);
    }
  });
});
