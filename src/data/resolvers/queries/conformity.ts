import { Conformities } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

interface IListArgs {
  contentId: string;
  conformityType?: string;
  conformityTypes: string[];
  limit: number;
}

const conformityQueries = {
  /**
   * Get activity log list
   */
  conformitiesForActivity(_root, doc: IListArgs) {
    const { contentId, conformityType, conformityTypes, limit } = doc;

    const filter: any = { mainTypeId: contentId };

    filter.relType = conformityType || { $in: conformityTypes };

    const sort = { createdAt: -1 };

    return Conformities.find(filter)
      .sort(sort)
      .limit(limit);
  },
};

moduleRequireLogin(conformityQueries);

export default conformityQueries;
