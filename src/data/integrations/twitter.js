import { Conversations, ConversationMessages, Customers } from '../../db/models';
import { CONVERSATION_STATUSES } from '../constants';

// save twit instances by integration id
export const TwitMap = {};

/**
 * Create new message
 */
const createMessage = async (conversation, content, user) => {
  if (conversation) {
    // create new message
    const message = await ConversationMessages.createMessage({
      conversationId: conversation._id,
      customerId: (await getOrCreateCustomer(conversation.integrationId, user))._id,
      content,
      internal: false,
    });

    // TODO: notify subscription server new message

    return message._id;
  }
  // FIXME: its a rather weird function
};

/**
 * get or create customer using twitter data
 * @return {Customer} return Customer document
 */
const getOrCreateCustomer = async (integrationId, user) => {
  const customer = await Customers.findOne({
    integrationId,
    'twitterData.id': user.id,
  });

  if (customer) {
    return customer;
  }

  // create customer
  return await Customers.createCustomer({
    name: user.name,
    // Workaround: customer create method now checks for customer email duplciation
    email: user.screen_name,
    integrationId,
    twitterData: {
      id: user.id,
      idStr: user.id_str,
      name: user.name,
      screenName: user.screen_name,
      profileImageUrl: user.profile_image_url,
    },
  });
};

/*
 * new message received in old converation, update status and readUsers
 */
const updateConversation = _id => {
  return Conversations.updateConversation(_id, {
    // reset read state
    readUserIds: [],

    // if closed, reopen
    status: CONVERSATION_STATUSES.OPEN,
  });
};

/**
 * create new conversation by regular tweet
 * @return {Promise} - returns created or updated Message document
 */
export const getOrCreateCommonConversation = async (data, integration) => {
  let conversation;

  if (data.in_reply_to_status_id) {
    // find conversation by tweet id
    conversation = await Conversations.findOne({
      'twitterData.id': data.in_reply_to_status_id,
    });

    // if closed, reopen it
    await updateConversation(conversation._id);

    // create new conversation
  } else {
    conversation = await Conversations.createConversation({
      content: data.text,
      integrationId: integration._id,
      customerId: (await getOrCreateCustomer(integration._id, data.user))._id,
      // save tweet id
      twitterData: {
        id: data.id,
        idStr: data.id_str,
        screenName: data.user.screen_name,
        isDirectMessage: false,
      },
    });
  }

  // create new message
  return createMessage(conversation, data.text, data.user);
};

/**
 * Post reply to twitter
 * @return {Promise}
 */
export const tweetReply = (conversation, text) => {
  const twit = TwitMap[conversation.integrationId];
  const twitterData = conversation.twitterData;

  // send direct message
  if (twitterData.isDirectMessage) {
    return twit.post(
      'direct_messages/new',
      {
        user_id: twitterData.directMessage.senderIdStr,
        text,
      },
      postCallback,
    );
  }

  // send reply
  return twit.post(
    'statuses/update',
    {
      status: `@${twitterData.screenName} ${text}`,

      // replying tweet id
      in_reply_to_status_id: twitterData.idStr,
    },
    postCallback,
  );
};

/**
 * Create new conversation by direct message
 */
export const getOrCreateDirectMessageConversation = async (data, integration) => {
  let conversation = await Conversations.findOne({
    'twitterData.isDirectMessage': true,
    $or: [
      {
        'twitterData.directMessage.senderId': data.sender_id,
        'twitterData.directMessage.recipientId': data.recipient_id,
      },
      {
        'twitterData.directMessage.senderId': data.recipient_id,
        'twitterData.directMessage.recipientId': data.sender_id,
      },
    ],
  });

  if (conversation) {
    // if closed, reopen it
    await updateConversation(conversation._id);
  } else {
    // create new conversation
    conversation = await Conversations.createConversation({
      content: data.text,
      integrationId: integration._id,
      customerId: (await getOrCreateCustomer(integration._id, data.sender))._id,

      // save tweet id
      twitterData: {
        id: data.id,
        idStr: data.id_str,
        screenName: data.sender.screen_name,
        isDirectMessage: true,
        directMessage: {
          senderId: data.sender_id,
          senderIdStr: data.sender_id_str,
          recipientId: data.recipient_id,
          recipientIdStr: data.recipient_id_str,
        },
      },
    });
  }

  // create new message
  return createMessage(conversation, data.text, data.sender);
};

const postCallback = error => {
  if (error) {
    throw Error(error.message);
  }
};
