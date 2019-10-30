import { Conformities } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

interface IListArgs {
  mainTypeId: string;
  mainType: string;
  relType?: string;
  limit: number;
}

const conformityQueries = {
  /**
   * Get activity log list
   */
  conformitiesForLog(_root, doc: IListArgs) {
    const { mainTypeId, mainType, relType, limit } = doc;

    const filter: any = { mainTypeId };

    if (relType) {
      filter.relType = relType;
    } else {
      filter.$or = [{ relType: { $in: ['task', 'note', 'conversation', 'email', mainType] } }];
    }

    const sort = { createdAt: -1 };

    return Conformities.find(filter)
      .sort(sort)
      .limit(limit);
  },
};

moduleRequireLogin(conformityQueries);

export default conformityQueries;
