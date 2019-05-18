import { Deals } from '../../db/models';
import { IStageDocument } from '../../db/models/definitions/boards';
import { BOARD_TYPES } from '../../db/models/definitions/constants';
import { dealsCommonFilter } from './queries/utils';

export default {
  async amount(stage: IStageDocument, _args, _context, { variableValues: { search } }) {
    const amountsMap = {};

    if (stage.type === BOARD_TYPES.DEAL) {
      const amountList = await Deals.aggregate([
        {
          $match: dealsCommonFilter({ stageId: stage._id }, { search }),
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

  itemsTotalCount(stage: IStageDocument, _args, _context, { variableValues: { search } }) {
    switch (stage.type) {
      case BOARD_TYPES.DEAL: {
        return Deals.find(dealsCommonFilter({}, { search })).count({ stageId: stage._id });
      }
    }
  },
};
