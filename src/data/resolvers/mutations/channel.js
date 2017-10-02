import { Channels } from '../../../db/models';
export default {
  /**
   * Create a new channel and send notifications to its members bar the creator
   * @param {Object}
   * @param {Object} args
   * @return {Promise} returns true
   */
  async channelsCreate(root, args) {
    const channel = await Channels.createChannel(args);
    return channel._id;
    // Send notification
    // sendNotifications(channelId, doc.memberIds, this.userId);
  },
};
