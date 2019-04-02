import * as moment from 'moment';
import { DealPipelines, Deals, DealStages } from '../../../db/models';
import { IStageDocument } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { INSIGHT_TYPES } from '../../constants';
import { moduleRequireLogin } from '../../permissions';
import {
  fixDate,
  fixDates,
  generateChartDataBySelector,
  generatePunchData,
  getSummaryData,
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
    const { startDate, endDate, boardId, pipelineIds } = args;
    const { start, end } = fixDates(startDate, endDate);

    const selector = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
      stageId: {},
    };

    if (boardId) {
      let stages: IStageDocument[] = [];

      if (pipelineIds) {
        stages = await DealStages.find({ pipelineId: { $in: pipelineIds.split(',') } });
      } else {
        const pipelines = await DealPipelines.find({ boardId });

        stages = await DealStages.find({ pipelineId: { $in: pipelines.map(p => p._id) } });
      }

      selector.stageId = { $in: stages.map(s => s._id) };
    } else {
      delete selector.stageId;
    }

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
};

moduleRequireLogin(dealInsightQueries);

export default dealInsightQueries;
