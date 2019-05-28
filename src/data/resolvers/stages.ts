import { Deals, Tickets } from '../../db/models';
import { IStageDocument } from '../../db/models/definitions/boards';
import { BOARD_TYPES } from '../../db/models/definitions/constants';
import { generateCommonFilters } from './queries/deals';
import { dealsCommonFilter } from './queries/utils';

export default {
  async amount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    const amountsMap = {};

    if (stage.type === BOARD_TYPES.DEAL) {
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

      amountList.forEach(item => {
        if (item._id) {
          amountsMap[item._id] = item.amount;
        }
      });
    }

    return amountsMap;
  },

  itemsTotalCount(stage: IStageDocument, _args, _context, { variableValues: { search, ...args } }) {
    switch (stage.type) {
      case BOARD_TYPES.DEAL: {
        return Deals.find(dealsCommonFilter(generateCommonFilters(args), { search })).count({ stageId: stage._id });
      }
      case BOARD_TYPES.TICKET: {
        return Tickets.find(dealsCommonFilter({}, { search })).count({ stageId: stage._id });
      }
    }
  },
};
