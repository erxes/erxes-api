import { Deals, DealStages } from '../../db/models';
import { IStageDocument } from '../../db/models/definitions/deals';
import { generateCommonFilters } from './queries/deals';
import { dealsCommonFilter } from './queries/utils';

export default {
  async amount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    const amountList = await Deals.aggregate([
      {
        $match: dealsCommonFilter({ ...generateCommonFilters(args), stageId: stage._id }, { search }),
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

    const amountsMap = {};

    amountList.forEach(item => {
      if (item._id) {
        amountsMap[item._id] = item.amount;
      }
    });

    return amountsMap;
  },

  async dealsTotalCount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    return Deals.find(dealsCommonFilter(generateCommonFilters(args), { search })).count({ stageId: stage._id });
  },

  async primaryDealsTotalCount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    return Deals.find(dealsCommonFilter(generateCommonFilters(args), { search })).count({ primaryStageId: stage._id });
  },

  deals(stage: IStageDocument) {
    return Deals.find({ stageId: stage._id }).sort({ order: 1, createdAt: -1 });
  },

  primaryDeals(stage: IStageDocument) {
    return Deals.find({ primaryStageId: stage._id }).sort({ order: 1, createdAt: -1 });
  },

  async stageLostInfo(stage: IStageDocument) {
    const result: { count?: number; percent?: number } = {};

    const stages = await DealStages.aggregate([
      {
        $match: {
          order: { $in: [stage.order, stage.order ? stage.order + 1 : 1] },
          pipelineId: stage.pipelineId,
        },
      },
      {
        $lookup: {
          from: 'deals',
          localField: '_id',
          foreignField: 'stageId',
          as: 'deals',
        },
      },
      {
        $project: {
          dealCount: { $size: '$deals' },
        },
      },
    ]);

    if (stages.length === 2) {
      result.count = stages[0].dealCount - stages[1].dealCount;
      result.percent = (stages[1].dealCount * 100) / stages[0].dealCount;
    }

    return result;
  },
};
