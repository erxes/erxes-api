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

  async inProcessDealsTotalCount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    const deals = await DealStages.aggregate([
      {
        $match: dealsCommonFilter(
          {
            ...generateCommonFilters(args),
            $and: [{ pipelineId: stage.pipelineId }, { probability: { $ne: 'Lost' } }, { _id: { $ne: stage._id } }],
          },
          { search },
        ),
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
          name: 1,
          deals: 1,
        },
      },
      {
        $unwind: '$deals',
      },
      {
        $match: {
          'deals.primaryStageId': stage._id,
        },
      },
    ]);

    return deals.length;
  },

  deals(stage: IStageDocument) {
    return Deals.find({ stageId: stage._id }).sort({ order: 1, createdAt: -1 });
  },

  async stageInfo(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    const result: { count?: number; percent?: number } = {};

    const stages = await DealStages.aggregate([
      {
        $match: dealsCommonFilter(
          {
            ...generateCommonFilters(args),
            order: { $in: [stage.order, stage.order ? stage.order + 1 : 1] },
            pipelineId: stage.pipelineId,
            probability: { $ne: 'Lost' },
          },
          { search },
        ),
      },
      {
        $lookup: {
          from: 'deals',
          localField: '_id',
          foreignField: 'stageId',
          as: 'currentDeals',
        },
      },
      {
        $lookup: {
          from: 'deals',
          localField: '_id',
          foreignField: 'primaryStageId',
          as: 'primaryDeals',
        },
      },
      {
        $project: {
          order: 1,
          currentDealCount: { $size: '$currentDeals' },
          primaryDealCount: { $size: '$primaryDeals' },
        },
      },
      { $sort: { order: 1 } },
    ]);

    if (stages.length === 2) {
      result.count = stages[0].currentDealCount - stages[1].currentDealCount;
      result.percent = (stages[1].primaryDealCount * 100) / stages[0].primaryDealCount;
    }

    return result;
  },
};
