import { Conformities } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

interface IListArgs {
  contentId: string;
  contentType: string;
  activityType?: string;
  limit: number;
}

const conformityQueries = {
  /**
   * Get activity log list
   */
  conformitiesForActivity(_root, doc: IListArgs) {
    const { contentId, contentType, activityType, limit } = doc;

    const filter: any = { mainTypeId: contentId };

    if (activityType) {
      filter.relType = activityType;
    } else {
      filter.$or = [{ relType: { $in: ['task', 'note', 'conversation', 'email', contentType] } }];
    }

    console.log(filter);

    const sort = { createdAt: -1 };

    return Conformities.find(filter)
      .sort(sort)
      .limit(limit);
  },
};

moduleRequireLogin(conformityQueries);

export default conformityQueries;
