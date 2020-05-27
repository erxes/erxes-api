import { Brands, Configs, ConversationMessages, Conversations, Customers, Integrations, Users } from '../../../db/models';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { ICustomerDocument } from '../../../db/models/definitions/customers';
import { debugBase } from '../../../debuggers';
import { sendRequest } from '../../utils';
import { publishMessage } from './conversations';

const signinGolomtApi = async () => {
  const signinUrl = 'chatapi/auth/signin';

  try{
    const response = await sendRequest({
      url: `${process.env.GOLOMT_POST_URL}${signinUrl}`,
      method: 'POST',
      body: {
        username: process.env.GOLOMT_API_USERNAME || '',
        password: process.env.GOLOMT_API_PASSWORD || '',
        key: process.env.GOLOMT_API_KEY || ''
      }
    });

    await Configs.createOrUpdateConfig({ code: 'GOLOMT_ACCESS_TOKEN', value: response });
    return response;
  } catch (e) {
    return {status: 'error', message: e.message}
  }
}

const checkAccessToken = async () => {
  const token = await Configs.findOne({code: 'GOLOMT_ACCESS_TOKEN'});

  if (!token) { return signinGolomtApi(); }

  if (!token.value) { return signinGolomtApi(); }

  if (!token.value.expires_in) { return signinGolomtApi(); }
  if (!token.value.access_token) { return signinGolomtApi(); }

  const now = new Date(Date.now());

  if (now > new Date(Date.parse(token.value.expires_in))) { return signinGolomtApi(); }

  return token.value;
}

export const sendMsgToGolomt = async (msg: IMessageDocument, customer: ICustomerDocument, integrationId: string) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const writeMsgUrl = 'chatapi/api/chat/write';

  const tokenVal = await checkAccessToken();

  if (tokenVal.status === 'error') {
    debugBase(`dont singin to golomt, because: ${tokenVal.message}`);
    return;
  }

  try {
    const integration = await Integrations.findOne({_id: integrationId});
    const brand = await Brands.findOne({_id: integration?.brandId});

    const body = {
      "social_id": msg.conversationId,
      "social_type": 5,
      "social_brand": brand?.name || '',
      "text": msg.content || '',
      "user_name": await Customers.getCustomerName(customer),
      "user_psid": customer._id,
      "user_email": customer.primaryEmail || '',
      "user_phone": customer.primaryPhone || '',
      "file_url": msg.attachments || [],
    };

    await sendRequest({
      url: `${process.env.GOLOMT_POST_URL}${writeMsgUrl}`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenVal.access_token}` },
      body,
    });
  } catch (e) {
    debugBase(`dont send message to golomt, because: ${e.message}`);
    return;
  }
};

const makeRandomId = ({ length }: { length: number }): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

interface IHookMessage {
  apiKey: string,
  apiToken: string,
  message: {
    content?: string,
    attachments?: any,
    conversationId: string,
    customerId?: string,
    userId?: string
  }
}

const golomtApiMutations = {
  async generateExpiredToken(_root,
    { apiKey, userName, password, tokenKey }: { apiKey: string; userName: string; password: string; tokenKey: string },
  ) {
    const apiKeyConfig = process.env.GOLOMT_API_KEY;

    if (apiKeyConfig !== apiKey) {
      throw new Error('wrong API_KEY');
    }

    const user = await Users.checkLoginAuth({ email: userName, password });

    const golomtTokenConfig = await Configs.findOne({ code: 'GOLOMT_API_TOKENS' });

    const tokenByUserId = golomtTokenConfig?.value || {};

    const apiToken = makeRandomId({ length: 50 });
    const expired = new Date(Date.now() + 259200000);

    tokenByUserId[user._id] = {
      apiToken,
      expired,
      userId: user._id
    };

    await Configs.createOrUpdateConfig({ code: 'GOLOMT_API_TOKENS', value: tokenByUserId });

    return {
      apiKey,
      userName,
      tokenKey,
      apiToken,
      expired,
    };
  },

  async hookMessage(_root, doc: IHookMessage) {
    const { apiKey, apiToken } = doc;
    if (!apiKey || !apiToken) {
      throw new Error('has not apiKey or ApiToken');
    }

    if (apiKey !== (process.env.GOLOMT_API_KEY)) {
      throw new Error('Wrong apiKey');
    }

    const configTokens = await Configs.findOne({code: 'GOLOMT_API_TOKENS'});
    const tokenByUserId = configTokens?.value || {};
    const tokenValue: Array<{apiToken: string, expired: Date, userId: string}> = Object.values(tokenByUserId) || [];
    const token  = tokenValue.find(item => item?.apiToken === apiToken);

    if (!token){
      throw new Error('apiToken not found');
    }

    if (token.expired < new Date(Date.now())) {
      throw new Error('apiToken was expired');
    }

    const message = doc.message;

    let customerId = message.customerId || '';
    if (customerId) {
      delete message[customerId]
    } else {
      const conversation = await Conversations.getConversation(message.conversationId);
      customerId = conversation.customerId || '';
    }

    message.userId = token.userId;

    const msgDocument = await ConversationMessages.createMessage(message);

    await publishMessage(msgDocument, customerId);

    return {
      status: 'success'
    }
  }
};

export default golomtApiMutations;
