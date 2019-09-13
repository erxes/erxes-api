import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { brandFactory, integrationFactory, userFactory } from '../db/factories';
import { Brands, Integrations, Users } from '../db/models';

import './setup.ts';

describe('mutations', () => {
  let _integration;
  let _brand;
  let _user;
  let context;

  const commonParamDefs = `
    $name: String!
    $brandId: String!
    $languageCode: String
  `;

  const commonParams = `
    name: $name
    brandId: $brandId
    languageCode: $languageCode
  `;

  const commonLeadProperties = {
    languageCode: 'en',
    loadType: faker.random.word(),
    fromEmail: faker.internet.email(),
    userEmailTitle: faker.random.word(),
    userEmailContent: faker.random.word(),
    adminEmailTitle: faker.random.word(),
    adminEmailContent: faker.random.word(),
    redirectUrl: faker.random.word(),
    successAction: faker.random.word(),
    leadData: {
      thankContent: faker.random.word(),
      adminEmails: [],
    },
  };

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _integration = await integrationFactory({});
    _brand = await brandFactory({});

    context = { user: _user };
  });

  afterEach(async () => {
    // Clearing test data
    await Users.deleteMany({});
    await Brands.deleteMany({});
    await Integrations.deleteMany({});
  });

  test('Create messenger integration', async () => {
    const args = {
      name: _integration.name,
      brandId: _brand._id,
      languageCode: 'en',
    };

    const mutation = `
      mutation integrationsCreateMessengerIntegration(${commonParamDefs}) {
        integrationsCreateMessengerIntegration(${commonParams}) {
          name
          brandId
          languageCode
        }
      }
    `;

    const integration = await graphqlRequest(mutation, 'integrationsCreateMessengerIntegration', args, context);

    expect(integration.name).toBe(args.name);
    expect(integration.brandId).toBe(args.brandId);
    expect(integration.languageCode).toBe(args.languageCode);
  });

  test('Edit messenger integration', async () => {
    const args = {
      _id: _integration._id,
      name: _integration.name,
      brandId: _brand._id,
      languageCode: 'en',
    };

    const mutation = `
      mutation integrationsEditMessengerIntegration(
        $_id: String!
        ${commonParamDefs}
      ) {
        integrationsEditMessengerIntegration(
        _id: $_id
        ${commonParams}
      ) {
          _id
          name
          brandId
          languageCode
        }
      }
    `;

    const integration = await graphqlRequest(mutation, 'integrationsEditMessengerIntegration', args, context);

    expect(integration._id).toBe(args._id);
    expect(integration.name).toBe(args.name);
    expect(integration.brandId).toBe(args.brandId);
    expect(integration.languageCode).toBe(args.languageCode);
  });

  test('Save messenger integration appearance data', async () => {
    const uiOptions = {
      color: faker.random.word(),
      wallpaper: faker.random.word(),
      logo: faker.random.image(),
    };

    const args = {
      _id: _integration._id,
      uiOptions,
    };

    const mutation = `
      mutation integrationsSaveMessengerAppearanceData(
        $_id: String!
        $uiOptions: MessengerUiOptions
      ) {
        integrationsSaveMessengerAppearanceData(_id: $_id, uiOptions: $uiOptions) {
          _id
          uiOptions
        }
      }
    `;

    const messengerAppearanceData = await graphqlRequest(
      mutation,
      'integrationsSaveMessengerAppearanceData',
      args,
      context,
    );

    expect(messengerAppearanceData._id).toBe(args._id);
    expect(messengerAppearanceData.uiOptions.toJSON()).toEqual(args.uiOptions);
  });

  test('Save messenger integration config', async () => {
    const messengerData = {
      supporterIds: [_user.id],
      notifyCustomer: false,
      isOnline: false,
      availabilityMethod: 'auto',
      requireAuth: false,
      showChat: false,
      showLauncher: false,
      forceLogoutWhenResolve: false,
      onlineHours: [
        {
          day: faker.random.word(),
          from: faker.random.word(),
          to: faker.random.word(),
        },
      ],
      timezone: faker.random.word(),
      messages: {
        en: {
          welcome: faker.random.word(),
          away: faker.random.word(),
          thank: faker.random.word(),
        },
      },
    };

    const args = {
      _id: _integration._id,
      messengerData,
    };

    const mutation = `
      mutation integrationsSaveMessengerConfigs(
        $_id: String!
        $messengerData: IntegrationMessengerData
      ) {
        integrationsSaveMessengerConfigs(
          _id: $_id
          messengerData: $messengerData
        ) {
          _id
          messengerData
        }
      }
    `;

    const messengerConfig = await graphqlRequest(mutation, 'integrationsSaveMessengerConfigs', args, context);

    expect(messengerConfig._id).toBe(args._id);
    expect(messengerConfig.messengerData.toJSON()).toEqual(args.messengerData);
  });

  test('Create lead integration', async () => {
    const args = {
      name: _integration.name,
      brandId: _brand._id,
      formId: _integration.formId,
      ...commonLeadProperties,
    };

    const mutation = `
      mutation integrationsCreateLeadIntegration(
        ${commonParamDefs}
        $formId: String!
        $leadData: IntegrationLeadData!
      ) {
        integrationsCreateLeadIntegration(
          ${commonParams}
          formId: $formId
          leadData: $leadData
        ) {
          name
          brandId
          languageCode
          formId
          leadData
        }
      }
    `;

    const leadIntegration = await graphqlRequest(mutation, 'integrationsCreateLeadIntegration', args, context);

    expect(leadIntegration.name).toBe(args.name);
    expect(leadIntegration.brandId).toBe(args.brandId);
    expect(leadIntegration.languageCode).toBe(args.languageCode);
    expect(leadIntegration.formId).toBe(args.formId);
  });

  test('Edit lead integration', async () => {
    const args = {
      _id: _integration._id,
      name: _integration.name,
      brandId: _brand._id,
      formId: _integration.formId,
      ...commonLeadProperties,
    };

    const mutation = `
      mutation integrationsEditLeadIntegration(
        $_id: String!
        $formId: String!
        $leadData: IntegrationLeadData!
        ${commonParamDefs}
      ) {
        integrationsEditLeadIntegration(
          _id: $_id
          formId: $formId
          leadData: $leadData
          ${commonParams}
        ) {
          _id
          name
          brandId
          languageCode
          formId
          leadData
        }
      }
    `;

    const leadIntegration = await graphqlRequest(mutation, 'integrationsEditLeadIntegration', args, context);

    expect(leadIntegration._id).toBe(args._id);
    expect(leadIntegration.name).toBe(args.name);
    expect(leadIntegration.brandId).toBe(args.brandId);
    expect(leadIntegration.languageCode).toBe(args.languageCode);
    expect(leadIntegration.formId).toBe(args.formId);
  });
});
