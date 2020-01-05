import * as _ from 'underscore';
import { Channels, Integrations } from '../../../db/models';
import { IChannel, IChannelDocument } from '../../../db/models/definitions/channels';
import { NOTIFICATION_CONTENT_TYPES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog, registerOnboardHistory } from '../../utils';
import { gatherIntegrationNames, gatherNames, gatherUsernames, LogDesc } from './logUtils';

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
    receivers: receivers || (channel.memberIds || []).filter(id => id !== channel.userId),
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
    let extraDesc: LogDesc[] = [{ userId: user._id, name: user.username || user.email }];

    if (doc.memberIds) {
      extraDesc = await gatherUsernames({
        idFields: doc.memberIds,
        foreignKey: 'memberIds',
        prevList: extraDesc,
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.CHANNEL,
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
    const channel = await Channels.getChannel(_id);

    const { integrationIds, memberIds } = doc;

    const { addedUserIds, removedUserIds } = checkUserIds(channel.memberIds || [], memberIds || []);

    await sendChannelNotifications(channel, 'invited', user, addedUserIds);
    await sendChannelNotifications(channel, 'removed', user, removedUserIds);

    const updated = await Channels.updateChannel(_id, doc);

    let extraDesc: LogDesc[] = [];

    if (channel.userId) {
      extraDesc = await gatherUsernames({
        idFields: [channel.userId],
        foreignKey: 'userId',
      });
    }

    // prevent saving of duplicated ids in log
    let combinedMemberIds = memberIds || [];
    let combinedIntegrationIds = integrationIds || [];

    // previous member ids should be saved
    if (channel.memberIds && channel.memberIds.length > 0) {
      combinedMemberIds = combinedMemberIds.concat(channel.memberIds);

      combinedMemberIds = _.uniq(combinedMemberIds);
    }

    if (combinedMemberIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: combinedMemberIds,
        foreignKey: 'memberIds',
        prevList: extraDesc,
      });
    }

    if (channel.integrationIds && channel.integrationIds.length > 0) {
      combinedIntegrationIds = combinedIntegrationIds.concat(channel.integrationIds);

      combinedIntegrationIds = _.uniq(combinedIntegrationIds);
    }

    if (combinedIntegrationIds.length > 0) {
      extraDesc = await gatherNames({
        collection: Integrations,
        idFields: combinedIntegrationIds,
        foreignKey: 'integrationIds',
        nameFields: ['name'],
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.CHANNEL,
        object: channel,
        newData: JSON.stringify(doc),
        description: `"${channel.name}" has been edited`,
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
    const channel = await Channels.getChannel(_id);

    await sendChannelNotifications(channel, 'removed', user);

    await Channels.removeChannel(_id);

    let extraDesc: LogDesc[] = [];

    if (channel.userId) {
      extraDesc = await gatherUsernames({
        idFields: [channel.userId],
        foreignKey: 'userId',
      });
    }

    if (channel.memberIds && channel.memberIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: channel.memberIds,
        foreignKey: 'memberIds',
        prevList: extraDesc,
      });
    }

    if (channel.integrationIds && channel.integrationIds.length > 0) {
      extraDesc = await gatherIntegrationNames({
        idFields: channel.integrationIds,
        foreignKey: 'integrationIds',
        prevList: extraDesc,
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.CHANNEL,
        object: channel,
        description: `"${channel.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return true;
  },
};

moduleCheckPermission(channelMutations, 'manageChannels');

export default channelMutations;
