import * as faker from 'faker';
import * as Random from 'meteor-random';
import widgetMutations from '../data/resolvers/mutations/widgets';
import { brandFactory, customerFactory, integrationFactory, messengerAppFactory } from '../db/factories';
import { Brands, Conversations, Customers, Integrations, MessengerApps } from '../db/models';
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

  test('successfull', async () => {
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
});
