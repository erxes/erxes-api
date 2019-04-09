import * as moment from 'moment';
import { Deals } from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { INSIGHT_TYPES } from '../../constants';
import { moduleRequireLogin } from '../../permissions';
import { getDateFieldAsStr } from './aggregationUtils';
import {
  fixChartData,
  fixDate,
  fixDates,
  generateChartDataBySelector,
  generatePunchData,
  getDealSelector,
  getSummaryData,
  getTimezone,
  IDealListArgs,
} from './insightUtils';

const dealInsightQueries = {
  /**
   * Counts conversations by each hours in each days.
   */
  async dealInsightsPunchCard(_root, args: IDealListArgs, { user }: { user: IUserDocument }) {
    const { endDate } = args;

    // check & convert endDate's value
    const end = moment(fixDate(endDate)).format('YYYY-MM-DD');
    const start = moment(end).add(-7, 'days');

    const matchMessageSelector = {
      // client or user
      createdAt: { $gte: start.toDate(), $lte: new Date(end) },
    };

    // TODO: need improvements on timezone calculation.
    const punchData = await generatePunchData(Deals, matchMessageSelector, user);

    return punchData;
  },

  /**
   * Sends combined charting data for trends, summaries and team members.
   */
  async dealInsightsMain(_root, args: IDealListArgs) {
    const { startDate, endDate } = args;
    const { start, end } = fixDates(startDate, endDate);

    const selector = await getDealSelector(args);

    const insightData: any = {
      summary: [],
      trend: await generateChartDataBySelector(selector, INSIGHT_TYPES.DEAL),
    };

    insightData.summary = await getSummaryData({
      startDate: start,
      endDate: end,
      collection: Deals,
      selector: { ...selector },
    });

    return insightData;
  },

  /**
   * Calculates average response close time for each team members.
   */
  async dealInsightsByTeamMember(_root, args: IDealListArgs, { user }: { user: IUserDocument }) {
    const dealMatch = await getDealSelector(args);

    const insightAggregateData = await Deals.aggregate([
      {
        $match: dealMatch,
      },
      {
        $project: {
          date: await getDateFieldAsStr({ fieldName: '$modifiedAt', timeZone: getTimezone(user) }),
          modifiedBy: 1,
        },
      },
      {
        $group: {
          _id: {
            modifiedBy: '$modifiedBy',
            date: '$date',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          modifiedBy: '$_id.modifiedBy',
          date: '$_id.date',
          count: 1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'modifiedBy',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$userDoc.details', 0] }, '$$ROOT'] } },
      },
      {
        $group: {
          _id: '$modifiedBy',
          count: { $sum: '$count' },
          fullName: { $first: '$fullName' },
          avatar: { $first: '$avatar' },
          chartDatas: {
            $push: {
              date: '$date',
              count: '$count',
            },
          },
        },
      },
    ]);

    if (insightAggregateData.length < 1) {
      return [];
    }

    // Variables holds every user's response time.
    const teamMembers: any = [];
    const responseUserData: any = {};

    const aggregatedTrend = {};

    for (const userData of insightAggregateData) {
      // responseUserData
      responseUserData[userData._id] = {
        count: userData.count,
        fullName: userData.fullName,
        avatar: userData.avatar,
      };
      // team members gather
      const fixedChartData = await fixChartData(userData.chartDatas, 'date', 'count');
      userData.chartDatas.forEach(row => {
        if (row.date in aggregatedTrend) {
          aggregatedTrend[row.date] += row.count;
        } else {
          aggregatedTrend[row.date] = row.count;
        }
      });

      teamMembers.push({
        data: {
          fullName: userData.fullName,
          avatar: userData.avatar,
          graph: fixedChartData,
        },
      });
    }

    return teamMembers;
  },
};

moduleRequireLogin(dealInsightQueries);

export default dealInsightQueries;
