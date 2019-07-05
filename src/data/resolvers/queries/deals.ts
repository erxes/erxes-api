import { Deals } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';
import { IListParams } from './boards';
import { generateDealCommonFilters } from './boardUtils';

interface IDealListParams extends IListParams {
  productIds?: [string];
}

const dealQueries = {
  /**
   * Deals list
   */
  async deals(_root, args: IDealListParams) {
    const filter = await generateDealCommonFilters(args);
    const sort = { order: 1, createdAt: -1 };

    return Deals.find(filter)
      .sort(sort)
      .skip(args.skip || 0)
      .limit(10);
  },

  /**
   *  Deal total amounts
   */
  async dealsTotalAmounts(_root, args: IDealListParams) {
    const filter = await generateDealCommonFilters(args);

    const dealCount = await Deals.find(filter).countDocuments();
    const amountList = await Deals.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'stages',
          let: { letStageId: '$stageId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$letStageId'],
                },
              },
            },
            {
              $project: {
                probability: {
                  $cond: {
                    if: {
                      $or: [{ $eq: ['$probability', 'Won'] }, { $eq: ['$probability', 'Lost'] }],
                    },
                    then: '$probability',
                    else: 'In progress',
                  },
                },
              },
            },
          ],
          as: 'stage_probability',
        },
      },
      {
        $unwind: '$productsData',
      },
      {
        $unwind: '$stage_probability',
      },
      {
        $project: {
          amount: '$productsData.amount',
          currency: '$productsData.currency',
          type: '$stage_probability.probability',
        },
      },
      {
        $group: {
          _id: { currency: '$currency', type: '$type' },

          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.type': -1, '_id.currency': 1 },
      },
    ]);

    const dealAmounts = amountList.map(deal => {
      return {
        _id: Math.random(),
        type: deal._id.type,
        currency: deal._id.currency,
        amount: deal.amount,
      };
    });

    console.log(dealAmounts);

    return { _id: Math.random(), dealCount, dealAmounts };
  },

  /**
   * Deal detail
   */
  dealDetail(_root, { _id }: { _id: string }) {
    return Deals.findOne({ _id });
  },
};

moduleRequireLogin(dealQueries);

checkPermission(dealQueries, 'deals', 'showDeals', []);

export default dealQueries;
