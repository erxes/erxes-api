import { Tags } from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission, requireLogin } from '../../permissions/wrappers';

interface IListArgs {
  kind?: string;
  status?: string;
  tag?: string;
  ids?: string[];
  brandIds?: string[];
  segmentIds?: string[];
  tagIds?: string[];
  page?: number;
  perPage?: number;
}

interface IQuery {
  kind?: string;
}

interface IStatusQueryBuilder {
  [index: string]: boolean | string;
}

interface ICountsByStatus {
  [index: string]: number;
}

interface ICountsByTag {
  [index: string]: number;
}

// basic count helper
const count = async (selector: {}, engagesApi): Promise<number> => {
  const res = await engagesApi.list(selector).countDocuments();
  return Number(res);
};

// Tag query builder
const tagQueryBuilder = (tagId: string) => ({ tagIds: tagId });

// status query builder
const statusQueryBuilder = (status: string, user?: IUserDocument): IStatusQueryBuilder => {
  if (status === 'live') {
    return { isLive: true };
  }

  if (status === 'draft') {
    return { isDraft: true };
  }

  if (status === 'paused') {
    return { isLive: false };
  }

  if (status === 'yours' && user) {
    return { fromUserId: user._id };
  }

  return {};
};

// count for each kind
const countsByKind = async engagesApi => ({
  all: await count({}, engagesApi),
  auto: await count({ kind: 'auto' }, engagesApi),
  visitorAuto: await count({ kind: 'visitorAuto' }, engagesApi),
  manual: await count({ kind: 'manual' }, engagesApi),
});

// count for each status type
const countsByStatus = async (
  { kind, user }: { kind: string; user: IUserDocument },
  engagesApi,
): Promise<ICountsByStatus> => {
  const query: IQuery = {};

  if (kind) {
    query.kind = kind;
  }

  return {
    live: await count({ ...query, ...statusQueryBuilder('live') }, engagesApi),
    draft: await count({ ...query, ...statusQueryBuilder('draft') }, engagesApi),
    paused: await count({ ...query, ...statusQueryBuilder('paused') }, engagesApi),
    yours: await count({ ...query, ...statusQueryBuilder('yours', user) }, engagesApi),
  };
};

// cout for each tag
const countsByTag = async (
  {
    kind,
    status,
    user,
  }: {
    kind: string;
    status: string;
    user: IUserDocument;
  },
  engagesApi,
): Promise<ICountsByTag[]> => {
  let query: any = {};

  if (kind) {
    query.kind = kind;
  }

  if (status) {
    query = { ...query, ...statusQueryBuilder(status, user) };
  }

  const tags = await Tags.find({ type: 'engageMessage' });

  // const response: {[name: string]: number} = {};
  const response: ICountsByTag[] = [];

  for (const tag of tags) {
    response[tag._id] = await count({ ...query, ...tagQueryBuilder(tag._id) }, engagesApi);
  }

  return response;
};

/*
 * List filter
 */
const listQuery = ({ segmentIds, brandIds, tagIds, kind, status, tag, ids }: IListArgs, user: IUserDocument): any => {
  if (ids) {
    return { _id: { $in: ids } };
  }

  if (segmentIds) {
    return { segmentIds: { $in: segmentIds } };
  }

  if (brandIds) {
    return { brandIds: { $in: brandIds } };
  }

  if (tagIds) {
    return { tagIds: { $in: tagIds } };
  }

  let query: any = {};

  // filter by kind
  if (kind) {
    query.kind = kind;
  }

  // filter by status
  if (status) {
    query = { ...query, ...statusQueryBuilder(status, user) };
  }

  // filter by tag
  if (tag) {
    query = { ...query, ...tagQueryBuilder(tag) };
  }

  return query;
};

const engageQueries = {
  /**
   * Group engage messages counts by kind, status, tag
   */
  engageMessageCounts(
    _root,
    { name, kind, status }: { name: string; kind: string; status: string },
    { user, dataSources }: { user: IUserDocument; dataSources: any },
  ) {
    if (name === 'kind') {
      return countsByKind(dataSources.EngagesAPI);
    }

    if (name === 'status') {
      return countsByStatus({ kind, user }, dataSources.EngagesAPI);
    }

    if (name === 'tag') {
      return countsByTag({ kind, status, user }, dataSources.EngagesAPI);
    }
  },

  /**
   * Engage messages list
   */
  engageMessages(_root, args: IListArgs, { user, dataSources }: { user: IUserDocument; dataSources: any }) {
    return dataSources.EngagesAPI.engagesList(listQuery(args, user), args);
  },

  /**
   * Get one message
   */
  engageMessageDetail(_root, { _id }: { _id: string }, { dataSources }) {
    return dataSources.EngagesAPI.engageDetail({ _id });
  },

  /**
   * Get all messages count. We will use it in pager
   */
  engageMessagesTotalCount(_root, args: IListArgs, { user, dataSources }: { user: IUserDocument; dataSources }) {
    return dataSources.EngagesAPI.count(listQuery(args, user), args);
  },
};

requireLogin(engageQueries, 'engageMessagesTotalCount');
requireLogin(engageQueries, 'engageMessageCounts');
requireLogin(engageQueries, 'engageMessageDetail');

checkPermission(engageQueries, 'engageMessages', 'showEngagesMessages', []);

export default engageQueries;
