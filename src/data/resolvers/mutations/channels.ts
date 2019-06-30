import { Channels } from '../../../db/models';
import { IChannel, IChannelDocument } from '../../../db/models/definitions/channels';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import utils from '../../utils';

interface IChannelsEdit extends IChannel {
  _id: string;
}

/**
 * Send notification to all members of this channel except the sender
 */
export const sendChannelNotifications = async (
  channel: IChannelDocument,
  type: 'invited' | 'removed',
  receivers?: string[],
) => {
  let content = `You have invited to '${channel.name}' channel.`;

  if (type === 'removed') {
    content = `You have been removed from '${channel.name}' channel.`;
  }

  return utils.sendNotification({
    createdUser: channel.userId || '',
    notifType: NOTIFICATION_TYPES.CHANNEL_MEMBERS_CHANGE,
    title: content,
    content,
    link: `/inbox?channelId=${channel._id}`,

    // exclude current user
    receivers: receivers ? receivers : (channel.memberIds || []).filter(id => id !== channel.userId),
  });
};

/**
 * Filters the channel members by invited or removed
 */
const checkMembers = (newMemberIds, oldMemberIds) => {
  const invitedMembers = oldMemberIds.filter(e => !newMemberIds.includes(e));

  const removedMembers = newMemberIds.filter(e => !oldMemberIds.includes(e));

  return { invitedMembers, removedMembers };
};

const channelMutations = {
  /**
   * Create a new channel and send notifications to its members bar the creator
   */
  async channelsAdd(_root, doc: IChannel, { user }: { user: IUserDocument }) {
    const channel = await Channels.createChannel(doc, user._id);

    await sendChannelNotifications(channel, 'invited');

    return channel;
  },

  /**
   * Update channel data
   */
  async channelsEdit(_root, { _id, ...doc }: IChannelsEdit) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    const { memberIds } = doc;

    const { invitedMembers, removedMembers } = checkMembers(memberIds || [], channel.memberIds || []);

    await sendChannelNotifications(channel, 'invited', invitedMembers);
    await sendChannelNotifications(channel, 'removed', removedMembers);

    return Channels.updateChannel(_id, doc);
  },

  /**
   * Remove a channel
   */
  async channelsRemove(_root, { _id }: { _id: string }) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    await Channels.removeChannel(_id);

    await sendChannelNotifications(channel, 'removed');

    return true;
  },
};

moduleCheckPermission(channelMutations, 'manageChannels');

export default channelMutations;
