import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { activityLogFactory } from '../db/factories';
import { ActivityLogs } from '../db/models';

import './setup.ts';

describe('activityLogQueries', () => {
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

  afterEach(async () => {
    // Clearing test data
    await ActivityLogs.deleteMany({});
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
});
