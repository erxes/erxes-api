import { graphqlRequest } from '../db/connection';
import { messengerAppFactory } from '../db/factories';
import { MessengerApps } from '../db/models';

import './setup.ts';

describe('mutations', () => {
  afterEach(async () => {
    // Clearing test data
    await MessengerApps.deleteMany({});
  });

  test('Edit messenger app', async () => {
    const messengerApp = await messengerAppFactory({});

    const mutation = `
      mutation messengerAppsEdit($_id: String!, $name: String, $kind: String) {
        messengerAppsEdit(_id: $_id, name: $name, kind: $kind) {
          name
          kind
        }
      }
    `;

    const args = {
      _id: messengerApp._id,
      name: 'Knowledge base',
      kind: 'knowledgebase',
    };

    const app = await graphqlRequest(mutation, 'messengerAppsEdit', args);

    expect(app.kind).toBe(args.kind);
    expect(app.name).toBe(args.name);
  });

  test('Add messenger app', async () => {
    const args = {
      name: 'Knowledge base',
      kind: 'knowledgebase',
    };

    const mutation = `
      mutation messengerAppsAdd($name: String, $kind: String, $credentials: JSON) {
        messengerAppsAdd(name: $name, kind: $kind, credentials: $credentials) {
          name
          kind
        }
      }
    `;

    const app = await graphqlRequest(mutation, 'messengerAppsAdd', args);

    expect(app.name).toBe(args.name);
    expect(app.kind).toBe(args.kind);
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
