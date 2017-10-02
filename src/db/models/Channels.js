import mongoose from 'mongoose';
import utils from '../utils';
import { createdAtModifier, channelModifier } from '../plugins';

function ChannelCreationException(message) {
  this.message = message;
  this.value = 'channel.create.exception';
  this.toString = `${this.value} - ${this.value}`;
}

const ChannelSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => utils.random.id(),
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  // TODO: Check if regex id is available for use
  integrationIds: {
    type: [String],
  },
  // TODO: Check if regex id is available for use
  memberIds: {
    type: [String],
  },
});

class Channel {
  /**
   * Create new channel,
   * adds `userId` to the `membersId` if it doesn't contain it
   * @param {Object} args
   * @param {func} args2
   * @return {Promise} Newly created channel obj
   */
  static createChannel(doc, handleError) {
    return this.create(doc, (err, doc) => {
      if (err) {
        if (!handleError) throw new ChannelCreationException('handleError method not supplied');
        return handleError(err);
      }
      return doc;
    });
  }
}

ChannelSchema.plugin(createdAtModifier);
ChannelSchema.plugin(channelModifier);
ChannelSchema.loadClass(Channel);

const Channels = mongoose.model('channels', ChannelSchema);

export default Channels;
