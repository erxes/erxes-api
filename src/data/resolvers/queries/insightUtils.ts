import * as moment from 'moment';
import * as _ from 'underscore';
import { ConversationMessages, Conversations, Integrations, Users } from '../../../db/models';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { IConversationDocument } from '../../../db/models/definitions/conversations';

interface IMessageSelector {
  userId?: string;
  createdAt: any;
  conversationId?: {
    $in: IConversationDocument[];
  };
}

interface IGenerateChartData {
  x: any;
  y: number;
}

interface IGenerateTimeIntervals {
  title: string;
  start: any;
  end: any;
}

interface IGenerateUserChartData {
  fullName?: string;
  avatar?: string;
  graph: IGenerateChartData[];
}

interface IIntegrationSelector {
  brandId?: string;
  kind?: string;
}

interface IFixDates {
  start: Date;
  end: Date;
}

interface IGenerateDuration {
  startTime: number;
  endTime: number;
  duration: number;
}

interface IResponseUserData {
  [index: string]: { responseTime: number; count: number; summaries?: number[] };
}

interface IGenerateResponseData {
  trend: IGenerateChartData[];
  time: number;
  teamMembers: {
    data: IGenerateUserChartData[];
  };
}

type ChartDocs = IMessageDocument | IConversationDocument;

interface IChartData {
  collection?: ChartDocs[];
  loopCount: number;
  duration: number;
  startTime: number;
  messageSelector?: any;
}

export interface IListArgs {
  integrationType: string;
  brandId: string;
  startDate: string;
  endDate: string;
  type: string;
}

/**
 * Find conversations or conversationIds.
 */
export const findConversations = async (
  args: IIntegrationSelector,
  conversationSelector: any,
  selectIds?: boolean,
): Promise<IConversationDocument[]> => {
  const integrationSelector: IIntegrationSelector = {};
  const { kind, brandId } = args;

  if (kind || brandId) {
    if (brandId) {
      integrationSelector.brandId = brandId;
    }

    if (kind) {
      integrationSelector.kind = kind;
    }

    conversationSelector.integrationIds = await Integrations.find(integrationSelector).select('_id');
  }

  if (selectIds) {
    return Conversations.find(conversationSelector).select('_id');
  }

  return Conversations.find(conversationSelector).sort({ createdAt: 1 });
};

/**
 * Builds messages find query selector.
 */
export const generateMessageSelector = async (
  brandId: string,
  integrationType: string,
  conversationSelector: any,
  messageSelector: IMessageSelector,
): Promise<IMessageSelector> => {
  const conversationIds = await findConversations({ brandId, kind: integrationType }, conversationSelector, true);

  messageSelector.conversationId = { $in: conversationIds };

  return messageSelector;
};

/**
 * Populates message collection into date range
 * by given duration and loop count for chart data.
 */
export const generateChartData = async (args: IChartData): Promise<IGenerateChartData[]> => {
  const { collection, loopCount, duration, startTime, messageSelector } = args;

  const results = [{ x: formatTime(moment(startTime), 'YYYY-MM-DD'), y: 0 }];
  let begin = 0;
  let end = 0;
  let count = 0;
  let dateText = null;

  // Variable that represents time interval by steps.
  const divider = duration / loopCount;

  for (let i = 0; i < loopCount; i++) {
    end = startTime + divider * (i + 1);
    begin = end - divider;
    dateText = formatTime(moment(end), 'YYYY-MM-DD');

    // messages count between begin and end time.
    if (collection) {
      count = collection.filter(message => begin < message.createdAt.getTime() && message.createdAt.getTime() < end)
        .length;
    }
    if (messageSelector) {
      count = await ConversationMessages.countDocuments({ ...messageSelector, createdAt: { $gte: begin, $lte: end } });
    }

    results.push({ x: dateText, y: count });
  }

  return results;
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
  duration,
  startTime,
}: {
  userId: string;
  userMessages: IMessageDocument[];
  duration: number;
  startTime: number;
}): Promise<IGenerateUserChartData> => {
  const user = await Users.findOne({ _id: userId });
  const userData = await generateChartData({
    collection: userMessages,
    loopCount: 4,
    duration,
    startTime,
  });

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

/*
 * Converts given value to date or if value in valid date
 * then returns default value
 */
export const fixDate = (value, defaultValue = new Date()): Date => {
  const date = new Date(value);

  if (!isNaN(date.getTime())) {
    return date;
  }

  return defaultValue;
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

export const generateDuration = ({ start, end }: { start: Date; end: Date }): IGenerateDuration => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return {
    startTime,
    endTime,
    duration: endTime - startTime,
  };
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
  duration: number,
  startTime: number,
): Promise<IGenerateResponseData> => {
  // preparing trend chart data
  const trend = await generateChartData({
    collection: responsData,
    loopCount: 7,
    duration,
    startTime,
  });

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
        duration,
        startTime,
      }),
      time: avgResTime,
      summaries,
    });
  }

  return { trend, time, teamMembers };
};
