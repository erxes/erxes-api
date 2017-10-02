import mongoose from 'mongoose';
import shortid from 'shortid';
import { createdAtModifier } from '../plugins';

function ChannelCreationException(message) {
  this.message = message;
  this.value = 'channel.create.exception';
  this.toString = `${this.value} - ${this.value}`;
}

const ChannelSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: shortid.generate,
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
  conversationCount: {
    type: Number,
  },
  openConversationCount: {
    type: Number,
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
  static createChannel(doc) {
    const { userId } = doc;

    if (!userId) {
      throw new ChannelCreationException('userId must be supplied');
    }

    doc.conversationCount = 0;
    doc.openConversationCount = 0;
    doc.memberIds = doc.memberIds || [];

    if (doc.memberIds.indexOf(this.userId) === -1) {
      doc.memberIds.push(this.userId);
    }
    return this.create(doc);
  }
}

ChannelSchema.plugin(createdAtModifier);
ChannelSchema.loadClass(Channel);

const Channels = mongoose.model('channels', ChannelSchema);

export default Channels;
