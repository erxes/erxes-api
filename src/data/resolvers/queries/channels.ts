import { IContext } from '../../../connectionResolver';
import { moduleRequireLogin } from '../../permissions';
import { paginate } from './utils';

interface IIn {
  $in: string[];
}

interface IChannelQuery {
  memberIds?: IIn;
}

const channelQueries = {
  /**
   * Channels list
   */
  channels(
    _root,
    { memberIds, ...queryParams }: { page: number; perPage: number; memberIds: string[] },
    { models: { Channels } }: IContext,
  ) {
    const query: IChannelQuery = {};
    const sort = { createdAt: -1 };

    if (memberIds) {
      query.memberIds = { $in: memberIds };
    }

    const channels = paginate(Channels.find(query), queryParams);

    return channels.sort(sort);
  },

  /**
   * Get one channel
   */
  channelDetail(_root, { _id }: { _id: string }, { models: { Channels } }: IContext) {
    return Channels.findOne({ _id });
  },

  /**
   * Get all channels count. We will use it in pager
   */
  channelsTotalCount(_root, _args, { models: { Channels } }: IContext) {
    return Channels.find({}).count();
  },

  /**
   * Get last channel
   */
  channelsGetLast(_root, _args, { models: { Channels } }: IContext) {
    return Channels.findOne({}).sort({ createdAt: -1 });
  },
};

moduleRequireLogin(channelQueries);

export default channelQueries;
