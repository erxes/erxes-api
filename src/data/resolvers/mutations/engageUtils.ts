import {
  ConversationMessages,
  Conversations,
  Customers,
  EngageMessages,
  Integrations,
  Segments,
  Users,
} from '../../../db/models';
import { CONVERSATION_STATUSES, KIND_CHOICES, METHODS } from '../../../db/models/definitions/constants';
import { ICustomerDocument } from '../../../db/models/definitions/customers';
import { IEngageMessageDocument } from '../../../db/models/definitions/engages';
import { IUserDocument } from '../../../db/models/definitions/users';
import { sendMessage } from '../../../messageBroker';
import { MESSAGE_KINDS } from '../../constants';
import { fetchBySegments } from '../../modules/segments/queryBuilder';

/**
 * Dynamic content tags
 */
const replaceKeys = ({
  content,
  customer,
  user,
}: {
  content: string;
  customer: ICustomerDocument;
  user: IUserDocument;
}): string => {
  let result = content;

  let customerName = customer.firstName || customer.lastName || 'Customer';

  if (customer.firstName && customer.lastName) {
    customerName = `${customer.firstName} ${customer.lastName}`;
  }

  const details = user.details && Object.keys(user.details.toJSON()).length > 0 ? user.details.toJSON() : {};

  // replace customer fields
  result = result.replace(/{{\s?customer.name\s?}}/gi, customerName);
  result = result.replace(/{{\s?customer.email\s?}}/gi, customer.primaryEmail || '');

  // replace user fields
  result = result.replace(/{{\s?user.fullName\s?}}/gi, details.fullName || '');
  result = result.replace(/{{\s?user.position\s?}}/gi, details.position || '');
  result = result.replace(/{{\s?user.email\s?}}/gi, user.email || '');

  return result;
};

/**
 * Find customers
 */
export const findCustomers = async ({
  customerIds,
  segmentIds = [],
  tagIds = [],
  brandIds = [],
}: {
  customerIds?: string[];
  segmentIds?: string[];
  tagIds?: string[];
  brandIds?: string[];
}): Promise<ICustomerDocument[]> => {
  // find matched customers
  let customerQuery: any = {};

  if (customerIds && customerIds.length > 0) {
    customerQuery = { _id: { $in: customerIds } };
  }

  if (tagIds.length > 0) {
    customerQuery = { tagIds: { $in: tagIds } };
  }

  if (brandIds.length > 0) {
    let integrationIds: string[] = [];

    for (const brandId of brandIds) {
      const integrations = await Integrations.findIntegrations({ brandId });

      integrationIds = [...integrationIds, ...integrations.map(i => i._id)];
    }

    customerQuery = { integrationId: { $in: integrationIds } };
  }

  if (segmentIds.length > 0) {
    const segments = await Segments.find({ _id: { $in: segmentIds } });

    let customerIdsBySegments: string[] = [];

    for (const segment of segments) {
      const cIds = await fetchBySegments(segment);

      customerIdsBySegments = [...customerIdsBySegments, ...cIds];
    }

    customerQuery = { _id: { $in: customerIdsBySegments } };
  }

  return Customers.find({ $or: [{ doNotDisturb: 'No' }, { doNotDisturb: { $exists: false } }], ...customerQuery });
};

export const send = async (engageMessage: IEngageMessageDocument) => {
  const { customerIds, segmentIds, tagIds, brandIds, fromUserId } = engageMessage;

  const user = await Users.findOne({ _id: fromUserId });

  if (!user) {
    throw new Error('User not found');
  }

  if (!engageMessage.isLive) {
    return;
  }

  const customers = await findCustomers({ customerIds, segmentIds, tagIds, brandIds });

  // save matched customer ids
  EngageMessages.setCustomerIds(engageMessage._id, customers);

  if (engageMessage.method === METHODS.EMAIL) {
    const customerInfos = customers.map(customer => {
      return {
        _id: customer._id,
        name: Customers.getCustomerName(customer),
        email: customer.primaryEmail,
      };
    });

    await sendMessage('erxes-api:send-engage', {
      customers: customerInfos,
      email: engageMessage.email,
      user: {
        email: user.email,
        name: user.details && user.details.fullName,
        position: user.details && user.details.position,
      },
      engageMessageId: engageMessage._id,
    });
  }

  if (engageMessage.method === METHODS.MESSENGER && engageMessage.kind !== MESSAGE_KINDS.VISITOR_AUTO) {
    await sendViaMessenger(engageMessage, customers, user);
  }
};

/**
 * Send via messenger
 */
const sendViaMessenger = async (
  message: IEngageMessageDocument,
  customers: ICustomerDocument[],
  user: IUserDocument,
) => {
  const { fromUserId } = message;

  if (!message.messenger) {
    return;
  }

  const { brandId, content } = message.messenger;

  // find integration
  const integration = await Integrations.findOne({
    brandId,
    kind: KIND_CHOICES.MESSENGER,
  });

  if (integration === null) {
    throw new Error('Integration not found');
  }

  for (const customer of customers) {
    // replace keys in content
    const replacedContent = replaceKeys({ content, customer, user });

    // create conversation
    const conversation = await Conversations.createConversation({
      userId: fromUserId,
      customerId: customer._id,
      integrationId: integration._id,
      content: replacedContent,
      status: CONVERSATION_STATUSES.NEW,
    });

    // create message
    await ConversationMessages.createMessage({
      engageData: {
        messageId: message._id,
        fromUserId,
        ...message.messenger.toJSON(),
      },
      conversationId: conversation._id,
      userId: fromUserId,
      customerId: customer._id,
      content: replacedContent,
    });
  }
};
