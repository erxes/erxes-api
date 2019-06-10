import * as Models from '../../db/models';
import { IStageDocument } from '../../db/models/definitions/boards';
import { generateCommonFilters } from './queries/utils';

export default {
  async amount(stage: IStageDocument, _args, _context, { variableValues: args }) {
    const amountsMap = {};

    if (args.modelName) {
      const filter = await generateCommonFilters({ ...args, stageId: stage._id });

      const amountList = await Models[args.modelName].aggregate([
        {
          $match: filter,
        },
        {
          $unwind: '$productsData',
        },
        {
          $project: {
            amount: '$productsData.amount',
            currency: '$productsData.currency',
          },
        },
        {
          $group: {
            _id: '$currency',
            amount: { $sum: '$amount' },
          },
        },
      ]);

      amountList.forEach(item => {
        if (item._id) {
          amountsMap[item._id] = item.amount;
        }
      });
    }

    return amountsMap;
  },

  async itemsTotalCount(stage: IStageDocument, _args, _context, { variableValues: args }) {
    if (args.modelName) {
      const filter = await generateCommonFilters({ ...args, stageId: stage._id });

      return Models[args.modelName].find(filter).count();
    }

    return 0;
  },
};
