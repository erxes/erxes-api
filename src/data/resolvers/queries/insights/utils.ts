import * as moment from 'moment';
import * as _ from 'underscore';
import {
  ConversationMessages,
  Conversations,
  DealPipelines,
  Deals,
  DealStages,
  Integrations,
  Users,
} from '../../../../db/models';
import { IMessageDocument } from '../../../../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../../../../db/models/definitions/conversations';
import { IStageDocument } from '../../../../db/models/definitions/deals';
import { IUser } from '../../../../db/models/definitions/users';
import { CONVERSATION_STATUSES, INSIGHT_TYPES } from '../../../constants';
import { getDateFieldAsStr } from '../aggregationUtils';
import { fixDate } from '../utils';
import {
  IDealListArgs,
  IDealSelector,
  IFilterSelector,
  IFixDates,
  IGenerateChartData,
  IGenerateMessage,
  IGeneratePunchCard,
  IGenerateResponseData,
  IGenerateTimeIntervals,
  IGenerateUserChartData,
  IListArgs,
  IMessageSelector,
  IResponseUserData,
  IStageSelector,
} from './types';

/**
 * Return filterSelector
 * @param args
 */
export const getFilterSelector = (args: IListArgs): any => {
  const selector: IFilterSelector = { integration: {} };
  const { startDate, endDate, integrationIds, brandIds } = args;
  const { start, end } = fixDates(startDate, endDate);

  if (integrationIds) {
    selector.integration.kind = { $in: integrationIds.split(',') };
  }

  if (brandIds) {
    selector.integration.brandId = { $in: brandIds.split(',') };
  }

  selector.createdAt = { $gte: start, $lte: end };

  return selector;
};

/**
 * Return filterSelector
 * @param args
 */
export const getDealSelector = async (args: IDealListArgs): Promise<IDealSelector> => {
  const { startDate, endDate, boardId, pipelineIds, status } = args;
  const { start, end } = fixDates(startDate, endDate);

  const selector: IDealSelector = {};
  const date = {
    $gte: start,
    $lte: end,
  };

  // If status is either won or lost, modified date is more important
  if (status) {
    selector.modifiedAt = date;
  } else {
    selector.createdAt = date;
  }

  const stageSelector: IStageSelector = {};

  if (status) {
    stageSelector.probability = status;
  }

  let stages: IStageDocument[] = [];

  if (boardId) {
    if (pipelineIds) {
      stageSelector.pipelineId = { $in: pipelineIds.split(',') };
    } else {
      const pipelines = await DealPipelines.find({ boardId });
      stageSelector.pipelineId = { $in: pipelines.map(p => p._id) };
    }

    stages = await DealStages.find(stageSelector);
    selector.stageId = { $in: stages.map(s => s._id) };
  } else {
    if (status) {
      stages = await DealStages.find(stageSelector);
      selector.stageId = { $in: stages.map(s => s._id) };
    }
  }

  return selector;
};

/**
 * Return conversationSelect for aggregation
 * @param args
 * @param conversationSelector
 * @param selectIds
 */
export const getConversationSelector = async (args: IListArgs, conversationSelector: any): Promise<any> => {
  const filterSelector = await getFilterSelector(args);

  if (filterSelector.integration) {
    const integrationIds = await Integrations.find(filterSelector.integration).select('_id');
    conversationSelector.integrationId = { $in: integrationIds.map(row => row._id) };
  }
  conversationSelector.createdAt = filterSelector.createdAt;

  return conversationSelector;
};

/**
 * Find conversations or conversationIds.
 */
export const findConversations = async (
  filterSelector: IFilterSelector,
  conversationSelector: any,
  selectIds?: boolean,
): Promise<IConversationDocument[]> => {
  if (Object.keys(filterSelector.integration).length > 0) {
    const integrationIds = await Integrations.find(filterSelector.integration).select('_id');
    conversationSelector.integrationId = integrationIds.map(row => row._id);
  }

  if (selectIds) {
    return Conversations.find(conversationSelector).select('_id');
  }

  return Conversations.find(conversationSelector).sort({ createdAt: 1 });
};
/**
 *
 * @param summaries
 * @param collection
 * @param selector
 */
export const getSummaryData = async ({
  startDate,
  endDate,
  selector,
  collection,
  dateFieldName = 'createdAt',
}: {
  startDate: Date;
  endDate: Date;
  selector: any;
  collection: any;
  dateFieldName?: string;
}): Promise<any> => {
  const summaries: Array<{ title?: string; count?: number }> = [];
  const intervals = generateTimeIntervals(startDate, endDate);
  const facets = {};
  // finds a respective message counts for different time intervals.
  for (const interval of intervals) {
    const facetMessageSelector = { ...selector };
    facetMessageSelector[dateFieldName] = {
      $gte: interval.start.toDate(),
      $lte: interval.end.toDate(),
    };

    facets[interval.title] = [
      {
        $match: facetMessageSelector,
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          count: 1,
        },
      },
    ];
  }

  const [legend] = await collection.aggregate([
    {
      $facet: facets,
    },
  ]);

  for (const interval of intervals) {
    const count = legend[interval.title][0] ? legend[interval.title][0].count : 0;
    summaries.push({
      title: interval.title,
      count,
    });
  }
  return summaries;
};

/**
 * Builds messages find query selector.
 */
export const generateMessageSelector = async ({
  args,
  createdAt,
  type,
  excludeBot,
}: IGenerateMessage): Promise<IMessageSelector> => {
  const filterSelector = getFilterSelector(args);
  const updatedCreatedAt = createdAt || filterSelector.createdAt;

  const messageSelector: any = {
    createdAt: updatedCreatedAt,
    userId: generateUserSelector(type),
  };

  if (excludeBot) {
    messageSelector.fromBot = { $exists: false };
  }

  // While searching by integration
  if (Object.keys(filterSelector.integration).length > 0) {
    const conversationIds = await findConversations(filterSelector, { createdAt: updatedCreatedAt }, true);

    const rawConversationIds = conversationIds.map(obj => obj._id);
    messageSelector.conversationId = { $in: rawConversationIds };
  }

  return messageSelector;
};
/**
 * Fix trend for missing values because from then aggregation,
 * it could return missing values for some dates. This method
 * will assign 0 values for missing x values.
 * @param startDate
 * @param endDate
 * @param data
 */
export const fixChartData = async (data: any[], hintX: string, hintY: string): Promise<IGenerateChartData[]> => {
  const results = {};
  data.map(row => {
    results[row[hintX]] = row[hintY];
  });

  return Object.keys(results)
    .sort()
    .map(key => {
      return { x: formatTime(moment(key), 'MM-DD'), y: results[key] };
    });
};

/**
 * Populates message collection into date range
 * by given duration and loop count for chart data.
 */
export const generateChartDataBySelector = async ({
  selector,
  type = INSIGHT_TYPES.CONVERSATION,
  dateFieldName = '$createdAt',
}: {
  selector: IMessageSelector;
  type?: string;
  dateFieldName?: string;
}): Promise<IGenerateChartData[]> => {
  const pipelineStages = [
    {
      $match: selector,
    },
    {
      $project: {
        date: getDateFieldAsStr({ fieldName: dateFieldName }),
      },
    },
    {
      $group: {
        _id: '$date',
        y: { $sum: 1 },
      },
    },
    {
      $project: {
        x: '$_id',
        y: 1,
        _id: 0,
      },
    },
    {
      $sort: {
        x: 1,
      },
    },
  ];

  if (type === INSIGHT_TYPES.DEAL) {
    return Deals.aggregate([pipelineStages]);
  }

  return ConversationMessages.aggregate([pipelineStages]);
};

export const generatePunchData = async (
  collection: any,
  selector: object,
  user: IUser,
): Promise<IGeneratePunchCard> => {
  const pipelineStages = [
    {
      $match: selector,
    },
    {
      $project: {
        hour: { $hour: { date: '$createdAt', timezone: '+08' } },
        day: { $isoDayOfWeek: { date: '$createdAt', timezone: '+08' } },
        date: await getDateFieldAsStr({ timeZone: getTimezone(user) }),
      },
    },
    {
      $group: {
        _id: {
          hour: '$hour',
          day: '$day',
          date: '$date',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        day: '$_id.day',
        hour: '$_id.hour',
        date: '$_id.date',
        count: 1,
      },
    },
  ];

  return collection.aggregate(pipelineStages);
};

/**
 * Populates message collection into date range
 * by given duration and loop count for chart data.
 */

export const generateChartDataByCollection = async (collection: any): Promise<IGenerateChartData[]> => {
  const results = {};

  collection.map(obj => {
    const date = formatTime(moment(obj.createdAt), 'YYYY-MM-DD');

    results[date] = (results[date] || 0) + 1;
  });

  return Object.keys(results)
    .sort()
    .map(key => {
      return { x: formatTime(moment(key), 'MM-DD'), y: results[key] };
    });
};

/**
 * Generates time intervals for main report
 */
export const generateTimeIntervals = (start: Date, end: Date): IGenerateTimeIntervals[] => {
  const month = moment(end).month();

  return [
    {
      title: 'In time range',
      start: moment(start),
      end: moment(end),
    },
    {
      title: 'This month',
      start: moment(1, 'DD'),
      end: moment(),
    },
    {
      title: 'This week',
      start: moment(end).weekday(0),
      end: moment(end),
    },
    {
      title: 'Today',
      start: moment(end).add(-1, 'days'),
      end: moment(end),
    },
    {
      title: 'Last 30 days',
      start: moment(end).add(-30, 'days'),
      end: moment(end),
    },
    {
      title: 'Last month',
      start: moment(month + 1, 'MM').subtract(1, 'months'),
      end: moment(month + 1, 'MM'),
    },
    {
      title: 'Last week',
      start: moment(end).weekday(-7),
      end: moment(end).weekday(0),
    },
    {
      title: 'Yesterday',
      start: moment(end).add(-2, 'days'),
      end: moment(end).add(-1, 'days'),
    },
  ];
};

/**
 * Generate chart data for given user
 */
export const generateUserChartData = async ({
  userId,
  userMessages,
}: {
  userId: string;
  userMessages: IMessageDocument[];
}): Promise<IGenerateUserChartData> => {
  const user = await Users.findOne({ _id: userId });
  const userData = await generateChartDataByCollection(userMessages);

  if (!user) {
    return {
      graph: userData,
    };
  }

  const userDetail = user.details;

  return {
    fullName: userDetail ? userDetail.fullName : '',
    avatar: userDetail ? userDetail.avatar : '',
    graph: userData,
  };
};

export const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  return time.format(format);
};

// TODO: check usage
export const getTime = (date: string | number): number => {
  return new Date(date).getTime();
};

export const fixDates = (startValue: string, endValue: string, count?: number): IFixDates => {
  // convert given value or get today
  const endDate = fixDate(endValue);

  const startDateDefaultValue = new Date(
    moment(endDate)
      .add(count ? count * -1 : -7, 'days')
      .toString(),
  );

  // convert given value or generate from endDate
  const startDate = fixDate(startValue, startDateDefaultValue);

  return { start: startDate, end: endDate };
};

export const getConversationDates = (endValue: string): any => {
  // convert given value or get today
  const endDate = fixDate(endValue);

  const month = moment(endDate).month();
  const startDate = new Date(
    moment(month + 1, 'MM')
      .subtract(1, 'months')
      .toString(),
  );

  return { $gte: startDate, $lte: endDate };
};

/*
 * Determines user or client
 */
export const generateUserSelector = (type: string): any => {
  let volumeOrResponse: any = null;

  if (type === 'response') {
    volumeOrResponse = { $ne: null };
  }

  return volumeOrResponse;
};

/**
 * Generate response chart data.
 */
export const generateResponseData = async (
  responsData: IMessageDocument[],
  responseUserData: IResponseUserData,
  allResponseTime: number,
): Promise<IGenerateResponseData> => {
  // preparing trend chart data
  const trend = await generateChartDataByCollection(responsData);

  // Average response time for all messages
  const time = Math.floor(allResponseTime / responsData.length);

  const teamMembers: any = [];

  const userIds = _.uniq(_.pluck(responsData, 'userId'));

  for (const userId of userIds) {
    const { responseTime, count, summaries } = responseUserData[userId];

    // Average response time for users.
    const avgResTime = Math.floor(responseTime / count);

    // preparing each team member's chart data
    teamMembers.push({
      data: await generateUserChartData({
        userId,
        userMessages: responsData.filter(message => userId === message.userId),
      }),
      time: avgResTime,
      summaries,
    });
  }

  return { trend, time, teamMembers };
};

export const getTimezone = (user: IUser): string => {
  return (user.details ? user.details.location : '+08') || '+08';
};

export const noConversationSelector = {
  $or: [
    { userId: { $exists: true }, messageCount: { $gt: 1 } },
    {
      userId: { $exists: false },
      $or: [
        {
          closedAt: { $exists: true },
          closedUserId: { $exists: true },
          status: CONVERSATION_STATUSES.CLOSED,
        },
        {
          status: { $ne: CONVERSATION_STATUSES.CLOSED },
        },
      ],
    },
  ],
};
