import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { activityLogFactory } from '../db/factories';
import { ActivityLogs } from '../db/models';
import { ACTIVITY_CONTENT_TYPES } from '../db/models/definitions/constants';

describe('activityLogQueries', () => {
  const commonParamDefs = `
    $contentType: String!,
    $contentId: String!,
    $limit: Int,
  `;

  const commonParams = `
    contentType: $contentType
    contentId: $contentId
    limit: $limit
  `;

  const qryActivityLogs = `
    query activityLogs(${commonParamDefs}) {
      activityLogs(${commonParams}) {
        _id
        action
        id
        createdAt
        content
        by {
          type
          details {
            avatar
            fullName
            position
          }
        }
      }
    }
  `;

  afterEach(async () => {
    // Clearing test data
    await ActivityLogs.deleteMany({});
  });

  test('Activity log list', async () => {
    const contentType = ACTIVITY_CONTENT_TYPES.CUSTOMER;
    const contentId = faker.random.uuid();

    for (let i = 0; i < 3; i++) {
      await activityLogFactory({ contentType: { type: contentType, id: contentId } });
    }

    const args = { contentType, contentId };

    const responses = await graphqlRequest(qryActivityLogs, 'activityLogs', args);

    expect(responses.length).toBe(3);

    const responsesWithLimit = await graphqlRequest(qryActivityLogs, 'activityLogs', { ...args, limit: 2 });

    expect(responsesWithLimit.length).toBe(2);
  });
});
