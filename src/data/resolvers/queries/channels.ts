import { Channels } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions';
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
  channels(_root, { memberIds, ...queryParams }: { page: number; perPage: number; memberIds: string[] }) {
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
  channelDetail(_root, { _id }: { _id: string }) {
    return Channels.findOne({ _id });
  },

  /**
   * Get all channels count. We will use it in pager
   */
  channelsTotalCount() {
    return Channels.find({}).countDocuments();
  },

  /**
   * Get last channel
   */
  channelsGetLast() {
    return Channels.findOne({}).sort({ createdAt: -1 });
  },
};

requireLogin(channelQueries, 'channelsGetLast');
requireLogin(channelQueries, 'channelsTotalCount');

checkPermission(channelQueries, 'channels', 'showChannels');
checkPermission(channelQueries, 'channelDetail', 'showChannelDetail');

export default channelQueries;
