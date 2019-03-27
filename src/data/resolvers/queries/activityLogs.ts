import { ActivityLogs } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions';

const activityLogQueries = {
  /**
   * Get activity log list
   */
  activityLogs(_root, { contentType, contentId, limit }: { contentType: string; contentId: string; limit: number }) {
    const query = { 'contentType.type': contentType, 'contentType.id': contentId };
    const sort = { createdAt: -1 };

    return ActivityLogs.find(query)
      .sort(sort)
      .limit(limit);
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
