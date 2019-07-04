import { Channels } from '../../../db/models';
import { IChannel, IChannelDocument } from '../../../db/models/definitions/channels';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import utils, { putLog } from '../../utils';

interface IChannelsEdit extends IChannel {
  _id: string;
}

/**
 * Send notification to all members of this channel except the sender
 */
export const sendChannelNotifications = async (channel: IChannelDocument) => {
  const content = `You have invited to '${channel.name}' channel.`;

  return utils.sendNotification({
    createdUser: channel.userId || '',
    notifType: NOTIFICATION_TYPES.CHANNEL_MEMBERS_CHANGE,
    title: content,
    content,
    link: `/inbox?channelId=${channel._id}`,

    // exclude current user
    receivers: (channel.memberIds || []).filter(id => id !== channel.userId),
  });
};

const channelMutations = {
  /**
   * Create a new channel and send notifications to its members bar the creator
   */
  async channelsAdd(_root, doc: IChannel, { user }: { user: IUserDocument }) {
    const channel = await Channels.createChannel(doc, user._id);

    await sendChannelNotifications(channel);

    await putLog({
      body: {
        createdBy: user._id,
        type: 'channel',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(doc),
        objectId: channel._id,
        unicode: user.username || user.email || user._id,
        description: `${doc.name} has been created`,
      },
    });

    return channel;
  },

  /**
   * Update channel data
   */
  async channelsEdit(_root, { _id, ...doc }: IChannelsEdit, { user }: { user: IUserDocument }) {
    const found = await Channels.findOne({ _id });
    const updated = await Channels.updateChannel(_id, doc);

    if (found && updated) {
      await putLog({
        body: {
          createdBy: user._id,
          type: 'channel',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(found),
          newData: JSON.stringify(doc),
          unicode: user.username || user.email || user._id,
          description: `${found.name} has been updated`,
        },
      });
    }

    return updated;
  },

  /**
   * Remove a channel
   */
  async channelsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const channel = await Channels.findOne({ _id });
    const removed = await Channels.removeChannel(_id);

    if (channel && removed) {
      await putLog({
        body: {
          createdBy: user._id,
          type: 'channel',
          action: LOG_ACTIONS.DELETE,
          oldData: JSON.stringify(channel),
          unicode: user.username || user.email || user._id,
          description: `${channel.name} has been removed`,
        },
      });
    }
  },
};

moduleCheckPermission(channelMutations, 'manageChannels');

export default channelMutations;
