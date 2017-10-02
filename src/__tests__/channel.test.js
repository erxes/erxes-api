/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { userFactory, integrationFactory } from '../db/factories';
import { Channels, Users, Integrations } from '../db/models';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('createChannel', () => {
  test('createChannel without supplying userId as second argument', () => {
    try {
      Channels.createChannel({
        name: 'Channel test',
      });
    } catch (e) {
      expect(e.value).toBe('channel.create.exception');
      expect(e.message).toBe('userId must be supplied');
    }
  });
});

describe('channel creation tests', () => {
  let _user;
  let _user2;
  let _integration;

  beforeEach(async () => {
    _user = await userFactory({});
    _integration = await integrationFactory({});
    _user2 = await userFactory({});
  });

  afterEach(async () => {
    await Channels.remove({});
    await Users.remove({});
    await Integrations.remove({});
  });

  test('create channel without validation errors', async () => {
    const doc = {
      name: 'Channel test',
      userId: _user._id,
      memberIds: [_user2._id],
      integrationIds: [_integration._id],
    };

    const channel = await Channels.createChannel(doc);
    expect(channel.memberIds.length).toBe(2);
  });

  test('create channel with validation errors', async () => {
    const doc = {
      userId: _user._id,
      memberIds: [_user2._id],
      integrationIds: [_integration._id],
    };
    try {
      await Channels.createChannel(doc);
    } catch (e) {
      expect(e.errors.name.message).toBe('Path `name` is required.');
    }
  });
});
