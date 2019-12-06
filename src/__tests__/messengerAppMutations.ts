import { graphqlRequest } from '../db/connection';
import { formFactory, messengerAppFactory } from '../db/factories';
import { MessengerApps } from '../db/models';

import './setup.ts';

describe('mutations', () => {
  afterEach(async () => {
    // Clearing test data
    await MessengerApps.deleteMany({});
  });

  test('Add knowledgebase', async () => {
    const args = {
      name: 'knowledgebase',
      integrationId: 'integrationId',
      topicId: 'topicId',
    };

    const mutation = `
      mutation messengerAppsAddKnowledgebase($name: String!, $integrationId: String!, $topicId: String!) {
        messengerAppsAddKnowledgebase(name: $name, integrationId: $integrationId, topicId: $topicId) {
          name
          kind
          showInInbox
          credentials
        }
      }
    `;

    const app = await graphqlRequest(mutation, 'messengerAppsAddKnowledgebase', args);

    expect(app.kind).toBe('knowledgebase');
    expect(app.showInInbox).toBe(false);
    expect(app.name).toBe(args.name);
    expect(app.credentials).toEqual({
      integrationId: args.integrationId,
      topicId: args.topicId,
    });
  });

  test('Add lead', async () => {
    const form = await formFactory({});

    const args = {
      name: 'lead',
      integrationId: 'integrationId',
      formId: form._id,
    };

    const mutation = `
      mutation messengerAppsAddLead($name: String!, $integrationId: String!, $formId: String!) {
        messengerAppsAddLead(name: $name, integrationId: $integrationId, formId: $formId) {
          name
          kind
          showInInbox
          credentials
        }
      }
    `;

    const app = await graphqlRequest(mutation, 'messengerAppsAddLead', args);

    expect(app.kind).toBe('lead');
    expect(app.showInInbox).toBe(false);
    expect(app.name).toBe(args.name);
    expect(app.credentials).toEqual({
      integrationId: args.integrationId,
      formCode: form.code,
    });
  });

  test('Remove', async () => {
    const app = await messengerAppFactory({ credentials: { integrationId: '_id', formCode: 'code' } });

    const mutation = `
      mutation messengerAppsRemove($_id: String!) {
        messengerAppsRemove(_id: $_id)
      }
    `;

    await graphqlRequest(mutation, 'messengerAppsRemove', { _id: app._id });

    const count = await MessengerApps.find().countDocuments();

    expect(count).toBe(0);
  });
});
