/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Permissions } from '../db/models';
import { permissionFactory, userFactory } from '../db/factories';
import { registerModule } from '../data/permissions/utils';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test permissions model', () => {
  let _permission;
  let _user;

  const doc = {
    actions: ['up', ' test'],
    allowed: true,
    module: 'module name',
  };

  registerModule({
    name: 'new module',
    description: 'd',
    actions: [
      { name: 'action', description: 'd', use: [] },
      { name: 'action1', description: 'd', use: [] },
      { name: 'action2', description: 'd', use: [] },
      { name: 'action3', description: 'd', use: [] },
    ],
  });

  beforeEach(async () => {
    // Creating test data
    _permission = await permissionFactory();
    _user = await userFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await Permissions.remove({});
  });

  test('Create permission invalid action', async () => {
    expect.assertions(1);
    try {
      await Permissions.createPermission({ userIds: [_user._id], ...doc });
    } catch (e) {
      expect(e.message).toEqual('Invalid data');
    }
  });

  test('Create permission', async () => {
    const permission = await Permissions.createPermission({
      ...doc,
      userIds: [_user._id],
      actions: ['action', 'action1', 'action2', 'action3'],
    });

    expect(permission.length).toEqual(4);
    expect(permission[1].userId).toEqual(_user._id);
    expect(permission[3].module).toEqual(doc.module);
  });

  test('Remove permission not found', async () => {
    expect.assertions(1);
    try {
      await Permissions.removePermission([_user._id]);
    } catch (e) {
      expect(e.message).toEqual(`Permission not found`);
    }
  });

  test('Remove permission', async () => {
    const isDeleted = await Permissions.removePermission([_permission.id]);

    expect(isDeleted).toBeTruthy();
  });
});
