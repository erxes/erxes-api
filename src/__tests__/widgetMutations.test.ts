import * as faker from 'faker';
import * as Random from 'meteor-random';
import widgetMutations from '../data/resolvers/mutations/widgets';
import {
  brandFactory,
  conversationFactory,
  conversationMessageFactory,
  customerFactory,
  engageMessageFactory,
  formFactory,
  integrationFactory,
  knowledgeBaseArticleFactory,
  messengerAppFactory,
  userFactory,
} from '../db/factories';
import {
  Brands,
  ConversationMessages,
  Conversations,
  Customers,
  Forms,
  Integrations,
  KnowledgeBaseArticles,
  MessengerApps,
} from '../db/models';
import { IBrandDocument } from '../db/models/definitions/brands';
import { CONVERSATION_STATUSES } from '../db/models/definitions/constants';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { IIntegrationDocument } from '../db/models/definitions/integrations';
import './setup.ts';

describe('messenger connect', () => {
  let _brand: IBrandDocument;
  let _integration: IIntegrationDocument;
  let _customer: ICustomerDocument;

  beforeEach(async () => {
    // Creating test data
    _brand = await brandFactory();
    _integration = await integrationFactory({
      brandId: _brand._id,
      kind: 'messenger',
    });
    _customer = await customerFactory({
      integrationId: _integration._id,
      primaryEmail: 'test@gmail.com',
      emails: ['test@gmail.com'],
      primaryPhone: '96221050',
      deviceTokens: ['111'],
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Brands.deleteMany({});
    await Integrations.deleteMany({});
    await Customers.deleteMany({});
    await MessengerApps.deleteMany({});
  });

  test('brand not found', async () => {
    try {
      await widgetMutations.widgetsMessengerConnect({}, { brandCode: 'invalidCode' });
    } catch (e) {
      expect(e.message).toBe('Brand not found');
    }
  });

  test('brand not found', async () => {
    const brand = await brandFactory({});

    try {
      await widgetMutations.widgetsMessengerConnect({}, { brandCode: brand.code || '' });
    } catch (e) {
      expect(e.message).toBe('Integration not found');
    }
  });

  test('returns proper integrationId', async () => {
    await messengerAppFactory({
      kind: 'knowledgebase',
      name: 'kb',
      credentials: {
        integrationId: _integration._id,
        topicId: 'topicId',
      },
    });

    await messengerAppFactory({
      kind: 'lead',
      name: 'lead',
      credentials: {
        integrationId: _integration._id,
        formCode: 'formCode',
      },
    });

    const { integrationId, brand, messengerData } = await widgetMutations.widgetsMessengerConnect(
      {},
      { brandCode: _brand.code || '', email: faker.internet.email() },
    );

    expect(integrationId).toBe(_integration._id);
    expect(brand.code).toBe(_brand.code);
    expect(messengerData.formCode).toBe('formCode');
    expect(messengerData.knowledgeBaseTopicId).toBe('topicId');
  });

  test('creates new customer', async () => {
    const email = 'newCustomer@gmail.com';
    const now = new Date();

    const { customerId } = await widgetMutations.widgetsMessengerConnect(
      {},
      { brandCode: _brand.code || '', email, companyData: { name: 'company' }, deviceToken: '111' },
    );

    expect(customerId).toBeDefined();

    const customer = await Customers.findById(customerId);

    if (!customer) {
      throw new Error('customer not found');
    }

    expect(customer._id).toBeDefined();
    expect(customer.primaryEmail).toBe(email);
    expect(customer.emails).toContain(email);
    expect(customer.integrationId).toBe(_integration._id);
    expect((customer.deviceTokens || []).length).toBe(1);
    expect(customer.deviceTokens).toContain('111');
    expect(customer.createdAt >= now).toBeTruthy();
    expect((customer.messengerData || { sessionCount: 0 }).sessionCount).toBe(1);
  });

  test('updates existing customer', async () => {
    const now = new Date();

    const { customerId } = await widgetMutations.widgetsMessengerConnect(
      {},
      {
        brandCode: _brand.code || '',
        email: _customer.primaryEmail,
        isUser: true,
        deviceToken: '222',
        // customData
        data: {
          plan: 1,
          first_name: 'name',
        },
      },
    );

    expect(customerId).toBeDefined();

    const customer = await Customers.findById(customerId);

    if (!customer) {
      throw new Error('customer not found');
    }

    expect(customer).toBeDefined();
    expect(customer.integrationId).toBe(_integration._id);
    expect(customer.createdAt < now).toBeTruthy();

    // must be updated
    expect(customer.firstName).toBe('name');
    expect(customer.isUser).toBeTruthy();
    expect((customer.deviceTokens || []).length).toBe(2);
    expect(customer.deviceTokens).toContain('111');
    expect(customer.deviceTokens).toContain('222');

    if (!customer.messengerData) {
      throw new Error('messengerData is null');
    }
    if (!customer.messengerData.customData) {
      throw new Error('customData is null');
    }

    expect(customer.messengerData.customData.plan).toBe(1);
  });
});

describe('insertMessage()', () => {
  let _integration: IIntegrationDocument;
  let _customer: ICustomerDocument;

  beforeEach(async () => {
    // Creating test data
    _integration = await integrationFactory({
      brandId: Random.id(),
      kind: 'messenger',
    });
    _customer = await customerFactory({ integrationId: _integration._id });
  });

  afterEach(async () => {
    // Clearing test data
    await Integrations.deleteMany({});
    await Customers.deleteMany({});
  });

  test('without conversationId', async () => {
    const now = new Date();

    const message = await widgetMutations.widgetsInsertMessage(
      {},
      {
        integrationId: _integration._id,
        customerId: _customer._id,
        message: faker.lorem.sentence(),
      },
    );

    // check message ==========
    expect(message).toBeDefined();
    expect(message.createdAt >= now).toBeTruthy();

    // check conversation =========
    const conversation = await Conversations.findById(message.conversationId);

    if (!conversation) {
      throw new Error('conversation is not found');
    }

    expect(conversation.status).toBe(CONVERSATION_STATUSES.OPEN);
    expect((conversation.readUserIds || []).length).toBe(0);

    // check customer =========
    const customer = await Customers.findOne({ _id: _customer._id });

    if (!customer) {
      throw new Error('customer is not found');
    }
    if (!customer.messengerData) {
      throw new Error('messengerData is null');
    }

    expect(customer.messengerData.isActive).toBeTruthy();
  });

  test('with conversationId', async () => {
    const conversation = await conversationFactory({});

    const message = await widgetMutations.widgetsInsertMessage(
      {},
      {
        integrationId: _integration._id,
        customerId: _customer._id,
        message: 'withConversationId',
        conversationId: conversation._id,
      },
    );

    expect(message.content).toBe('withConversationId');
  });
});

describe('saveBrowserInfo()', () => {
  afterEach(async () => {
    // Clearing test data
    await Integrations.deleteMany({});
    await Customers.deleteMany({});
    await Brands.deleteMany({});
  });

  test('not found', async () => {
    let customer = await customerFactory({});

    // integration not found
    try {
      await widgetMutations.widgetsSaveBrowserInfo(
        {},
        {
          customerId: customer._id,
          browserInfo: {},
        },
      );
    } catch (e) {
      expect(e.message).toBe('Integration not found');
    }

    const integration = await integrationFactory({});
    customer = await customerFactory({ integrationId: integration._id });

    try {
      await widgetMutations.widgetsSaveBrowserInfo(
        {},
        {
          customerId: customer._id,
          browserInfo: {},
        },
      );
    } catch (e) {
      expect(e.message).toBe('Brand not found');
    }
  });

  test('success', async () => {
    const user = await userFactory({});
    const brand = await brandFactory({});
    const integration = await integrationFactory({ brandId: brand._id });

    const customer = await customerFactory({ integrationId: integration._id });

    await engageMessageFactory({
      userId: user._id,
      messenger: {
        brandId: brand._id,
        content: 'engageMessage',
        rules: [
          {
            text: 'text',
            kind: 'currentPageUrl',
            condition: 'is',
            value: '/page',
          },
        ],
      },
      kind: 'visitorAuto',
      method: 'messenger',
      isLive: true,
    });

    const response = await widgetMutations.widgetsSaveBrowserInfo(
      {},
      {
        customerId: customer._id,
        browserInfo: { url: '/page' },
      },
    );

    expect(response && response.content).toBe('engageMessage');
  });
});

describe('rest', () => {
  test('widgetsSaveCustomerGetNotified', async () => {
    let customer = await customerFactory({});

    customer = await widgetMutations.widgetsSaveCustomerGetNotified(
      {},
      {
        customerId: customer._id,
        type: 'email',
        value: 'email',
      },
    );

    expect(customer.visitorContactInfo && customer.visitorContactInfo.email).toBe('email');
  });

  test('widgetsReadConversationMessages', async () => {
    const user = await userFactory({});
    const conversation = await conversationFactory({});

    const message = await conversationMessageFactory({
      conversationId: conversation._id,
      userId: user._id,
      isCustomerRead: false,
    });

    expect(message.isCustomerRead).toBe(false);

    await widgetMutations.widgetsReadConversationMessages(
      {},
      {
        conversationId: conversation._id,
      },
    );

    const updatedMessage = await ConversationMessages.findOne({ _id: message._id });

    expect(updatedMessage && updatedMessage.isCustomerRead).toBe(true);
  });
});

describe('knowledgebase', () => {
  test('widgetsKnowledgebaseIncReactionCount', async () => {
    const article = await knowledgeBaseArticleFactory({
      reactionChoices: ['wow'],
    });

    await widgetMutations.widgetsKnowledgebaseIncReactionCount(
      {},
      {
        articleId: article._id,
        reactionChoice: 'wow',
      },
    );

    const updatedArticle = await KnowledgeBaseArticles.findOne({ _id: article._id });

    expect(updatedArticle && updatedArticle.reactionCounts && updatedArticle.reactionCounts.wow).toBe(1);
  });
});

describe('lead', () => {
  test('widgetsLeadIncreaseViewCount', async () => {
    const form = await formFactory({});
    const integration = await integrationFactory({ formId: form._id });

    await widgetMutations.widgetsLeadIncreaseViewCount(
      {},
      {
        formId: form._id,
      },
    );

    const updatedInteg = await Integrations.findOne({ _id: integration._id });

    expect(updatedInteg && updatedInteg.leadData && updatedInteg.leadData.viewCount).toBe(1);
  });
});
