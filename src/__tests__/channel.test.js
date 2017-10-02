/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { userFactory, integrationFactory } from '../db/factories';
import { Channels, Users, Integrations } from '../db/models';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('createChannel', () => {
  test('channel validations', () => {
    let channel = Channels({});
    let err = channel.validateSync();

    expect(err.errors['name'].message).toBe('Path `name` is required.');
    expect(Object.keys(err.errors).length).toBe(1);
  });

  test('createChannel without supplying userId as second argument', () => {
    try {
      Channels.createChannel({
        name: 'Channel test',
      });
    } catch (e) {
      expect(e.value).toBe('channel.create.exception');
    }
  });
});

describe('createChannel 2', () => {
  let _user;
  let _user2;
  let _integration;
  beforeEach(() => {
    return userFactory({}).then(user => {
      _user = user;
      return integrationFactory({}).then(integration => {
        _integration = integration;
        return userFactory({}).then(user2 => {
          _user2 = user2;
        });
      });
    });
  });

  afterEach(() => {
    return Promise.all([Channels.remove({}), Users.remove({}), Integrations.remove({})]);
  });

  test('create channel without errors', () => {
    const doc = {
      name: 'Channel test',
      userId: _user._id,
      memberIds: [_user2._id],
      integrationIds: [_integration._id],
    };

    let channelObj = Channels(doc);
    let errors = channelObj.validateSync();
    expect(errors).toBe(undefined);

    Channels.createChannel(doc).then(doc => {
      expect(doc.memberIds.length).toBe(2);
    });
  });
});

describe('createChannel 3', () => {
  let _user;
  let _user2;
  let _integration;
  beforeEach(() => {
    return userFactory({}).then(user => {
      _user = user;
      return integrationFactory({}).then(integration => {
        _integration = integration;
        return userFactory({}).then(user2 => {
          _user2 = user2;
        });
      });
    });
  });

  afterEach(() => {
    return Promise.all([Channels.remove({}), Users.remove({}), Integrations.remove({})]);
  });

  test('create channel with validation errors', () => {
    const doc = {
      userId: _user._id,
      memberIds: [_user2._id],
      integrationIds: [_integration._id],
    };

    Channels.createChannel(doc, err => {
      expect(typeof err).toBe('object');
    });
  });
});
