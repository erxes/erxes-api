import { graphqlRequest } from '../db/connection';
import { userFactory, webhookFactory } from '../db/factories';
import { Users, Webhooks } from '../db/models';

import './setup.ts';

describe('Test webhooks mutations', () => {
  let _webhook;
  let _user;
  let doc;
  let context;

  const commonParamDefs = `
  $actions: [WebhookActionInput]
  $url: String!
`;

  const commonParams = `
  actions: $actions,
  url: $url,
`;

  beforeEach(async () => {
    // Creating test data
    _webhook = await webhookFactory({});
    _user = await userFactory({});

    context = { user: _user };

    doc = {
      url: `${_webhook.url}1`,
      actions: _webhook.actions,
    };
  });

  afterEach(async () => {
    // Clearing test data
    await Webhooks.deleteMany({});
    await Users.deleteMany({});
  });

  test('Add webhook', async () => {
    const mutation = `
      mutation webhooksAdd(${commonParamDefs}) {
        webhooksAdd(${commonParams}) {
          url
          actions{
              label
              type
              action
          }
          token
        }
      }
    `;

    const webhook = await graphqlRequest(mutation, 'webhooksAdd', doc, context);

    expect(webhook.url).toBe(doc.url);
    expect(webhook.actions.length).toBeGreaterThan(1);
    expect(webhook.token).toBeDefined();
  });

  test('Edit webhook', async () => {
    const mutation = `
      mutation webhooksEdit($_id: String! ${commonParamDefs}){
        webhooksEdit(_id: $_id ${commonParams}) {
          _id
          url
          actions{
            label
            type
            action
          }
          token
        }
      }
    `;

    const webhook = await graphqlRequest(mutation, 'webhooksEdit', { _id: _webhook._id, ...doc }, context);

    expect(webhook._id).toBe(_webhook._id);
    expect(webhook.url).toBe(doc.name);
    expect(webhook.actions.length).toBeGreaterThan(1);
  });

  test('Remove webhook', async () => {
    const mutation = `
      mutation webhooksRemove($id: String!) {
        webhooksRemove(id: $id)
      }
    `;

    await graphqlRequest(mutation, 'webhooksRemove', { ids: _webhook._id }, context);

    expect(await Webhooks.find({ _id: _webhook._id })).toEqual([]);
  });
});
