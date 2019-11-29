import { Channels } from '../../../db/models';
import { IChannel, IChannelDocument } from '../../../db/models/definitions/channels';
import { NOTIFICATION_CONTENT_TYPES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_TYPES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { putCreateLog, putDeleteLog, putUpdateLog, registerOnboardHistory } from '../../utils';
import { gatherUsernames, LogDesc } from './logUtils';
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
    contentType: NOTIFICATION_CONTENT_TYPES.CHANNEL,
    contentTypeId: channel._id,
    createdUser: user,
    notifType: NOTIFICATION_TYPES.CHANNEL_MEMBERS_CHANGE,
    title: `Channel updated`,
    action,
    content: `${channel.name} channel`,
    link: `/inbox/index?channelId=${channel._id}`,

    // exclude current user
    receivers: receivers ? receivers : (channel.memberIds || []).filter(id => id !== channel.userId),
  });
};

const channelMutations = {
  /**
   * Create a new channel and send notifications to its members bar the creator
   */
  async channelsAdd(_root, doc: IChannel, { user }: IContext) {
    const channel = await Channels.createChannel(doc, user._id);

    await sendChannelNotifications(channel, 'invited', user);

    // for showing usernames instead of user id
    let extraDesc: LogDesc[] = [];

    if (doc.memberIds) {
      extraDesc = await gatherUsernames(doc.memberIds, 'memberIds');
    }

    extraDesc.push({ userId: user._id, name: user.username });

    await putCreateLog(
      {
        type: LOG_TYPES.CHANNEL,
        newData: JSON.stringify({ ...doc, userId: user._id }),
        object: channel,
        description: `"${doc.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return channel;
  },

  /**
   * Update channel data
   */
  async channelsEdit(_root, { _id, ...doc }: IChannelsEdit, { user }: IContext) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    const { memberIds } = doc;

    const { addedUserIds, removedUserIds } = checkUserIds(channel.memberIds || [], memberIds || []);

    await sendChannelNotifications(channel, 'invited', user, addedUserIds);
    await sendChannelNotifications(channel, 'removed', user, removedUserIds);

    const updated = await Channels.updateChannel(_id, doc);

    const extraDesc = await gatherUsernames(memberIds, 'memberIds');

    extraDesc.push({ userId: user._id, name: user.username });

    await putUpdateLog(
      {
        type: LOG_TYPES.CHANNEL,
        object: channel,
        newData: JSON.stringify(doc),
        description: `${channel.name} has been updated`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    if ((channel.integrationIds || []).toString() !== (updated.integrationIds || []).toString()) {
      registerOnboardHistory({ type: 'connectIntegrationsToChannel', user });
    }

    return updated;
  },

  /**
   * Remove a channel
   */
  async channelsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const channel = await Channels.findOne({ _id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    await sendChannelNotifications(channel, 'removed', user);

    await Channels.removeChannel(_id);

    const extraDesc = await gatherUsernames(channel.memberIds, 'memberIds');

    extraDesc.push({ userId: user._id, name: user.username });

    await putDeleteLog(
      {
        type: LOG_TYPES.CHANNEL,
        object: channel,
        description: `${channel.name} has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return true;
  },
};

moduleCheckPermission(channelMutations, 'manageChannels');

export default channelMutations;
