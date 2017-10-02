import { Channels } from '../../../db/models';
export default {
  /**
   * Create a new channel and send notifications to its members bar the creator
   * @param {Object}
   * @param {Object} args
   * @return {Promise} returns true
   */
  channelsCreate(root, args) {
    // TODO: sendNotifications method should here
    return Channels.createChannel(args);
  },
};
