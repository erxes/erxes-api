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
  userId: {
    type: String,
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
   *
   */
  static preSave(doc) {
    const { userId } = doc;

    if (!userId) {
      throw new ChannelCreationException('userId must be supplied');
    }

    doc.memberIds = doc.memberIds || [];

    if (!doc.memberIds.includes(doc.userId)) {
      doc.memberIds.push(doc.userId);
    }
  }

  /**
   * Create a new channel,
   * adds `userId` to the `memberIds` if it doesn't contain it
   * @param {Object} args
   * @return {Promise} Newly created channel obj
   */
  static createChannel(doc) {
    this.preSave(doc);
    doc.conversationCount = 0;
    doc.openConversationCount = 0;
    return this.create(doc);
  }

  static updateChannel(id, doc) {
    if (doc && doc._id) {
      delete doc._id;
    }

    this.preSave(doc);
    return this.update({ _id: id }, doc);
  }

  static removeChannel(id) {
    return this.remove({ _id: id });
  }
}

ChannelSchema.plugin(createdAtModifier);
ChannelSchema.loadClass(Channel);

const Channels = mongoose.model('channels', ChannelSchema);

export default Channels;
