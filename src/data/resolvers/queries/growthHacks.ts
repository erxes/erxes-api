import { GrowthHacks, Stages } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';
import { IListParams } from './boards';
import { generateGrowthHackCommonFilters } from './boardUtils';

const growthHackQueries = {
  /**
   * Growth hack list
   */
  async growthHacks(_root, args: IListParams) {
    const filter = await generateGrowthHackCommonFilters(args);
    const sort = { order: 1, createdAt: -1 };

    return GrowthHacks.find(filter)
      .sort(sort)
      .skip(args.skip || 0)
      .limit(10);
  },

  async growthHacksPriorityMatrix(_root, args: IListParams) {
    const filter = await generateGrowthHackCommonFilters(args);
    const { pipelineId } = args;

    if (pipelineId) {
      const stageIds = await Stages.find({ pipelineId }).distinct('_id');

      filter.stageId = { $in: stageIds };
    }

    filter.ease = { $exists: true, $gt: 0 };
    filter.impact = { $exists: true, $gt: 0 };

    const { sortField, sortDirection } = args;

    const sort: { [key: string]: any } = {};

    if (sortField) {
      sort[sortField] = sortDirection;
    }

    return GrowthHacks.find(filter).sort(sort);
  },

  /**
   * Growth hack detail
   */
  growthHackDetail(_root, { _id }: { _id: string }) {
    return GrowthHacks.findOne({ _id });
  },
};

moduleRequireLogin(growthHackQueries);

checkPermission(growthHackQueries, 'growthHacks', 'showGrowthHacks', []);

export default growthHackQueries;
