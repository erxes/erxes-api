/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Users, Permissions } from '../db/models';
import { registerModule, can } from '../data/permissions/utils';
import { userFactory, permissionFactory } from '../db/factories';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test permission utils', () => {
  let _user;
  let _user2;

  const moduleObj = {
    name: 'testModule',
    description: 'Test module',
    actions: [
      {
        name: 'testModuleAction',
        description: 'Test module action',
        use: ['action 1', 'action 2'],
      },
    ],
  };

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({ isOwner: true });
    _user2 = await userFactory({});

    await permissionFactory({
      action: 'action1',
      userId: _user2._id,
    });

    await permissionFactory({
      requiredActions: ['action1', 'action2'],
      userId: _user2._id,
      allowed: true,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Users.remove({ isOwner: true });
    await Permissions.remove({});
  });

  test('Register module check duplicated module', async () => {
    registerModule(moduleObj);

    expect.assertions(1);
    try {
      registerModule(moduleObj);
    } catch (e) {
      expect(e.message).toEqual(`"${moduleObj.name}" module has been registered`);
    }
  });

  test('Register module check duplicated action', async () => {
    expect.assertions(1);
    try {
      registerModule({
        name: 'new module',
        description: 'd',
        actions: moduleObj.actions,
      });
    } catch (e) {
      expect(e.message).toEqual(`"${moduleObj.actions[0].name}" action has been registered`);
    }
  });

  test('Register module check duplicated action', async () => {
    expect.assertions(1);
    try {
      registerModule({
        name: 'new module',
        description: 'd',
        actions: moduleObj.actions,
      });
    } catch (e) {
      expect(e.message).toEqual(`"${moduleObj.actions[0].name}" action has been registered`);
    }
  });

  test('Check permission userId required', async () => {
    const checkPermission = await can('action', null);

    expect(checkPermission).toEqual(false);
  });

  test('Check permission user not found', async () => {
    const checkPermission = await can('action', 'fakeId');

    expect(checkPermission).toEqual(false);
  });

  test('Check permission is owner', async () => {
    const checkPermission = await can('action', _user._id);

    expect(checkPermission).toEqual(true);
  });

  test('Check permission', async () => {
    const checkPermission = await can('action1', _user2._id);

    expect(checkPermission).toEqual(true);
  });
});
