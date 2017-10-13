import mongoose from 'mongoose';
import shortid from 'shortid';

const ConversationSchema = mongoose.Schema({
  _id: { type: String, default: shortid.generate },
  content: String,
  integrationId: String,
  customerId: String,
  userId: String,
  assignedUserId: String,
  participatedUserIds: [String],
  readUserIds: [String],
  createdAt: Date,
  status: String,
  messageCount: Number,
  tagIds: [String],

  // number of total conversations
  number: Number,
  twitterData: Object,
  facebookData: Object,
});

export const Conversations = mongoose.model('conversations', ConversationSchema);

const MessageSchema = mongoose.Schema({
  _id: { type: String, default: shortid.generate },
  content: String,
  attachments: Object,
  mentionedUserIds: [String],
  conversationId: String,
  internal: Boolean,
  customerId: String,
  userId: String,
  createdAt: Date,
  isCustomerRead: Boolean,
  engageData: Object,
  formWidgetData: Object,
  facebookData: Object,
});

export const Messages = mongoose.model('conversation_messages', MessageSchema);
