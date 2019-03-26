import cronJobs from '../cronJobs';
import { ACTIVITY_ACTIONS, ACTIVITY_CONTENT_TYPES, ACTIVITY_PERFORMER_TYPES, ACTIVITY_TYPES } from '../data/constants';
import { customerFactory, segmentFactory } from '../db/factories';
import { ActivityLogs } from '../db/models';

describe('test activityLogsCronJob', () => {
  test('test if it is working as intended', async () => {
    // check if the activity log is being created ==================
    const nameEqualsConditions = [
      {
        type: 'string',
        dateUnit: 'days',
        value: 'John Smith',
        operator: 'c',
        field: 'firstName',
      },
    ];

    const customer = await customerFactory({ firstName: 'john smith' });

    const segment = await segmentFactory({
      contentType: ACTIVITY_CONTENT_TYPES.CUSTOMER,
      conditions: nameEqualsConditions,
    });

    await cronJobs.createActivityLogsFromSegments();

    expect(await ActivityLogs.find().countDocuments()).toBe(1);

    const aLog = await ActivityLogs.findOne();

    if (!aLog) {
      throw new Error('Activity log is empty');
    }

    expect(aLog.activity.toObject()).toEqual({
      type: ACTIVITY_TYPES.SEGMENT,
      action: ACTIVITY_ACTIONS.CREATE,
      content: segment.name,
      id: segment._id,
    });
    expect(aLog.contentType.toObject()).toEqual({
      type: ACTIVITY_CONTENT_TYPES.CUSTOMER,
      id: customer._id,
    });

    if (!aLog.performedBy) {
      throw new Error('Activity log is empty');
    }

    expect(aLog.performedBy.toObject()).toEqual({
      type: ACTIVITY_PERFORMER_TYPES.SYSTEM,
    });

    // check if the second activity log is being created
    // also check if the duplicate activity log is
    // not being created for the former customer ================
    const nameEqualsConditions2 = [
      {
        type: 'string',
        dateUnit: 'days',
        value: 'jane smith',
        operator: 'c',
        field: 'firstName',
      },
    ];

    await customerFactory({ firstName: 'jane smith' });
    await segmentFactory({
      contentType: ACTIVITY_CONTENT_TYPES.CUSTOMER,
      conditions: nameEqualsConditions2,
    });

    await cronJobs.createActivityLogsFromSegments();

    expect(await ActivityLogs.find().countDocuments()).toBe(2);
  });
});
