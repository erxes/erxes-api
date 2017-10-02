/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { userFactory, integrationFactory } from '../db/factories';
import { Channels, Users, Integrations } from '../db/models';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('channel creation tests', () => {
  let _user;
  let _user2;
  let _integration;

  /**
   * Before each test create test data
   * containing 2 users and an integration
   */
  beforeEach(async () => {
    _user = await userFactory({});
    _integration = await integrationFactory({});
    _user2 = await userFactory({});
  });

  /**
   * After each test remove the test data
   */
  afterEach(async () => {
    await Channels.remove({});
    await Users.remove({});
    await Integrations.remove({});
  });

  test('create channel without validation errors', async () => {
    try {
      Channels.createChannel({
        name: 'Channel test',
      });
    } catch (e) {
      expect(e.value).toBe('channel.create.exception');
      expect(e.message).toBe('userId must be supplied');
    }

    const doc = {
      name: 'Channel test',
      userId: _user._id,
      memberIds: [_user2._id],
      integrationIds: [_integration._id],
    };

    const channel = await Channels.createChannel(doc);
    expect(channel.memberIds.length).toBe(2);
  });
});
