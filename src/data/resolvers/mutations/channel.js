import { Channels } from '../../../db/models';
export default {
  /**
   * Create a new channel and send notifications to its members bar the creator
   * @param {Object}
   * @param {Object} args
   * @return {Promise} returns true
   */
  async channelsCreate(root, args) {
    return Channels.createChannel(args);
  },
};
