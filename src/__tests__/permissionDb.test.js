/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Permissions, UsersGroups } from '../db/models';
import { userFactory, permissionFactory, usersGroupFactory } from '../db/factories';
import { registerModule } from '../data/permissions/utils';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test permissions model', () => {
  let _permission;
  let _user;
  let _group;

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
    _group = await usersGroupFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await Permissions.remove({});
    await UsersGroups.remove({});
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
      groupIds: [_group._id],
      actions: ['action', 'action1', 'action2', 'action3'],
    });

    expect(permission.length).toEqual(8);
    const per = permission.find(p => p.groupId === _group._id && p.action === 'action');
    expect(per.module).toEqual(doc.module);
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
