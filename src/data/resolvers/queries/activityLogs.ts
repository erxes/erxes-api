import { moduleRequireLogin } from '../../permissions/wrappers';

const activityLogQueries = {
  /**
   * Get activity log list
   */
  activityLogs(_root, doc: any) {
    const { contentType, contentId, activityType } = doc;

    const query = { 'contentType.type': contentType, 'contentType.id': contentId };

    if (activityType) {
      query['activity.type'] = activityType;
    }

    return [];
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
