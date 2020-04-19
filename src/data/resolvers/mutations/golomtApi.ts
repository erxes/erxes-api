import { Brands, Configs, ConversationMessages, Customers, Integrations, Users } from '../../../db/models';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { ICustomerDocument } from '../../../db/models/definitions/customers';
import { sendRequest } from '../../utils';
import { publishMessage } from './conversations';

const signinGolomtApi = async () => {
  const signinUrl = 'chatapi/auth/signin';
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
}

const checkAccessToken = async () => {
  const token = await Configs.findOne({code: 'GOLOMT_ACCESS_TOKEN'});

  if (!token) { return signinGolomtApi(); }

  if (!token.value) { return signinGolomtApi(); }

  if (!token.value.EXPIRES_IN) { return signinGolomtApi(); }
  if (!token.value.ACCESS_TOKEN) { return signinGolomtApi(); }

  const now = new Date(Date.now());

  if (now > token.value.EXPIRES_IN) { return signinGolomtApi(); }

  return token.value;
}

export const sendMsgToGolomt = async (msg: IMessageDocument, customer: ICustomerDocument, integrationId: string) => {
  const writeMsgUrl = 'chatapi/api/write';

  const integration = await Integrations.findOne({ _id: integrationId });
  const brand = await Brands.findOne({ _id: integration?.brandId || ''});

  const tokenVal = await checkAccessToken();

  const body = {
    "social_id": 'erxes-widget',
    "social_type": brand?.code || '5',
    "text": msg.content || '',
    "conversationId": msg.conversationId,
    "user_name": await Customers.getCustomerName(customer),
    "user_psid": customer._id,
    "user_email": customer.primaryEmail || '',
    "user_phone": customer.primaryPhone || '',
    "file_url": JSON.stringify(msg.attachments) || '[]',
  };

  await sendRequest({
    url: `${process.env.GOLOMT_POST_URL}${writeMsgUrl}`,
    method: 'POST',
    headers: {'Authorization': tokenVal.ACCESS_TOKEN},
    body
  });
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
    content?: string;
    attachments?: any;
    conversationId: string;
    customerId?: string;
    userId?: string;
  }
}

const golomtApiMutations = {
  async generateExpiredToken(
    { apiKey, userName, password, tokenKey }: { apiKey: string; userName: string; password: string; tokenKey: string },
  ) {
    const apiKeyConfig = process.env.GOLOMT_API_KEY;

    if (apiKeyConfig !== apiKey) {
      throw new Error('wrong API_KEY');
    }

    const user = await Users.checkLoginAuth({ email: userName, password });

    const golomtTokenConfig = await Configs.findOne({ code: 'GOLOMT_API_TOKENS' });

    const tokenByUserId = golomtTokenConfig?.value || {};

    const token = makeRandomId({ length: 50 });
    const expired = new Date(Date.now() + 259200000);

    tokenByUserId[user._id] = {
      token,
      expired,
      userId: user._id
    };

    await Configs.createOrUpdateConfig({ code: 'GOLOMT_API_TOKENS', value: tokenByUserId });

    return {
      apiKey,
      userName,
      tokenKey,
      token,
      expired,
    };
  },

  async hookMessage(doc: IHookMessage) {
    const { apiKey, apiToken } = doc;
    if (!apiKey || !apiToken) {
      throw new Error('has not apiKey or ApiToken');
    }

    if (apiKey !== (process.env.GOLOMT_API_KEY)) {
      throw new Error('Wrong API KEY');
    }

    const configTokens = await Configs.findOne({code: 'GOLOMT_API_TOKENS'});
    const tokenByUserId = configTokens?.value || {};
    const tokenValue: Array<{token: string, expired: Date, userId: string}> = Object.values(tokenByUserId) || [];
    const token  = tokenValue.find(item => item?.token === apiToken);

    if (!token){
      throw new Error('api token not found');
    }

    if (token.expired < new Date(Date.now())) {
      throw new Error('api token was expired');
    }

    const message = doc.message;
    message.userId = token.userId;

    const msgDocument = await ConversationMessages.createMessage(message);

    await publishMessage(msgDocument, message.customerId);

    return {
      status: 'success'
    }
  }
};

export default golomtApiMutations;
