import { Channels } from '../../../db/models';
import { IChannel, IChannelDocument } from '../../../db/models/definitions/channels';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import utils from '../../utils';
import { checkUserIds } from './notifications';

interface IChannelsEdit extends IChannel {
  _id: string;
}

/**
 * Send notification to all members of this channel except the sender
 */
export const sendChannelNotifications = async (
  channel: IChannelDocument,
  type: 'invited' | 'removed',
  user: IUserDocument,
  receivers?: string[],
) => {
  let action = `invited you to the`;

  if (type === 'removed') {
    action = `removed you from`;
  }

  return utils.sendNotification({
    createdUser: user,
    notifType: NOTIFICATION_TYPES.CHANNEL_MEMBERS_CHANGE,
    title: `Channel updated`,
    action,
    content: `${channel.name} channel`,
    link: `/inbox?channelId=${channel._id}`,

    // exclude current user
    receivers: receivers ? receivers : (channel.memberIds || []).filter(id => id !== channel.userId),
  });
};

const channelMutations = {
  /**
   * Create a new channel and send notifications to its members bar the creator
   */
  async channelsAdd(_root, doc: IChannel, { user }: { user: IUserDocument }) {
    const channel = await Channels.createChannel(doc, user._id);

    await sendChannelNotifications(channel, 'invited', user);

    return channel;
  },

  /**
   * Update channel data
   */
  async channelsEdit(_root, { _id, ...doc }: IChannelsEdit, { user }: { user: IUserDocument }) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    const { memberIds } = doc;

    const { addedUserIds, removedUserIds } = checkUserIds(channel.memberIds || [], memberIds || []);

    await sendChannelNotifications(channel, 'invited', user, addedUserIds);
    await sendChannelNotifications(channel, 'removed', user, removedUserIds);

    return Channels.updateChannel(_id, doc);
  },

  /**
   * Remove a channel
   */
  async channelsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    await Channels.removeChannel(_id);

    await sendChannelNotifications(channel, 'removed', user);

    return true;
  },
};

moduleCheckPermission(channelMutations, 'manageChannels');

export default channelMutations;
