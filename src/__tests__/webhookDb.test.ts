import { webhookFactory } from '../db/factories';
import { Webhooks } from '../db/models';

import './setup.ts';

describe('Test webhooks model', () => {
  let _webhook;
  let _webhook2;

  beforeEach(async () => {
    // Creating test data
    _webhook = await webhookFactory({});
    _webhook2 = await webhookFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await Webhooks.deleteMany({});
  });

  test('Get webhook', async () => {
    try {
      await Webhooks.getWebHook('fakeId');
    } catch (e) {
      expect(e.message).toBe('Webhook not found');
    }

    const response = await Webhooks.getWebHook(_webhook._id);

    expect(response).toBeDefined();
  });

  test('Create webhook check duplicated', async () => {
    expect.assertions(1);
    try {
      await Webhooks.createWebhook(_webhook2);
    } catch (e) {
      expect(e.message).toEqual('Webhook duplicated');
    }
  });

  test('Update webhook check duplicated', async () => {
    expect.assertions(1);
    try {
      await Webhooks.updateWebhook(_webhook2._id, {
        url: _webhook.url,
        token: _webhook.token,
        actions: _webhook.actions,
      });
    } catch (e) {
      expect(e.message).toEqual('Webhook duplicated');
    }
  });

  test('Create Webhook', async () => {
    const webhookObj = await Webhooks.createWebhook({
      url: `${_webhook.url}1`,
      actions: _webhook.actions,
      token: _webhook.token,
    });

    expect(webhookObj).toBeDefined();
    expect(webhookObj.url).toEqual(`${_webhook.name}1`);
    expect(webhookObj.actions).toEqual(_webhook.actions);
    expect(webhookObj.token).toEqual(_webhook.token);
  });

  test('Update Webhook', async () => {
    const webhookObj = await Webhooks.updateWebhook(_webhook._id, {
      url: _webhook.name,
      actions: _webhook.actions,
      token: _webhook.token,
    });

    expect(webhookObj).toBeDefined();
    expect(webhookObj.url).toEqual(_webhook.url);
    expect(webhookObj.actions).toEqual(_webhook.actions);
    expect(webhookObj.token).toEqual(_webhook.token);
  });

  test('Remove Webhook', async () => {
    const isDeleted = await Webhooks.removeWebhooks(_webhook.id);
    expect(isDeleted).toBeTruthy();
  });
});
