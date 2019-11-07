import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { activityLogFactory, userFactory } from '../db/factories';
import { ActivityLogs } from '../db/models';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_CONTENT_TYPES,
  ACTIVITY_PERFORMER_TYPES,
  ACTIVITY_TYPES,
} from '../db/models/definitions/constants';

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
        id
        createdAt
        content
        by {
          _id
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
    const activityType = ACTIVITY_TYPES.CUSTOMER;
    const contentId = faker.random.uuid();
    const activityId = faker.random.uuid();

    const args: any = {
      activity: { id: activityId, type: activityType, action: ACTIVITY_ACTIONS.CREATE, content: 'content' },
      contentType: { type: contentType, id: contentId },
      performer: {},
    };

    // first
    const activityLog = await activityLogFactory(args);

    const user = await userFactory();

    args.performer = {
      type: ACTIVITY_PERFORMER_TYPES.USER,
      id: user._id,
    };

    // second
    const secondActivityLog = await activityLogFactory(args);

    args.performer = {
      type: ACTIVITY_PERFORMER_TYPES.USER,
      id: 'fakeUserId',
    };

    // third
    const thirdActivityLog = await activityLogFactory(args);

    args.performer = {
      type: ACTIVITY_PERFORMER_TYPES.CUSTOMER,
    };

    // fourth
    const fourthActivityLog = await activityLogFactory(args);

    const filter: any = { contentType, activityType, contentId };

    let responses = await graphqlRequest(qryActivityLogs, 'activityLogs', filter);

    expect(responses.length).toBe(4);

    const activity = activityLog.activity;

    const first = responses.find(r => r._id === activityLog._id);
    expect(first.id).toBe(activity.id);
    expect(first.action).toBe(`${activity.type}-${activity.action}`);
    expect(first.content).toBe(activity.content);

    const second = responses.find(r => r._id === secondActivityLog._id);
    expect(second.by._id).toBe(user._id);
    expect(second.by.type).toBe(ACTIVITY_PERFORMER_TYPES.USER);

    const third = responses.find(r => r._id === thirdActivityLog._id);
    expect(third.by).toBe(null);

    const fourth = responses.find(r => r._id === fourthActivityLog._id);
    expect(fourth.by.type).toBe(ACTIVITY_PERFORMER_TYPES.CUSTOMER);

    await activityLogFactory({ contentType: { type: contentType, id: contentId } });

    // filtering when no activity type
    filter.activityType = '';

    responses = await graphqlRequest(qryActivityLogs, 'activityLogs', filter);

    expect(responses.length).toBe(5);

    // filtering when no activity type
    filter.limit = 2;
    const responsesWithLimit = await graphqlRequest(qryActivityLogs, 'activityLogs', filter);

    expect(responsesWithLimit.length).toBe(2);
  });
});
