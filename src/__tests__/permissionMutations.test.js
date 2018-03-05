/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Permissions, Users } from '../db/models';
import { permissionFactory, userFactory } from '../db/factories';
import permissionsMutations from '../data/resolvers/mutations/permissions';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test permissions mutations', () => {
  let _permission;
  let _user;

  const doc = {
    actions: ['up', ' test'],
    allowed: true,
    module: 'module name',
  };

  beforeEach(async () => {
    // Creating test data
    _permission = await permissionFactory();
    _user = await userFactory({
      isOwner: true,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Permissions.remove({});
    await Users.remove({});
  });

  test('Permission login required functions', async () => {
    const checkLogin = async (fn, args) => {
      try {
        await fn({}, args, {});
      } catch (e) {
        expect(e.message).toEqual('Login required');
      }
    };

    expect.assertions(2);

    // add permission
    checkLogin(permissionsMutations.permissionsAdd, doc);

    // remove permission
    checkLogin(permissionsMutations.permissionsRemove, { ids: [] });
  });

  test(`test if Error('Permission required') error is working as intended`, async () => {
    const checkLogin = async (fn, args) => {
      try {
        await fn({}, args, { user: { _id: 'fakeId' } });
      } catch (e) {
        expect(e.message).toEqual('Permission required');
      }
    };

    expect.assertions(2);

    // add permission
    checkLogin(permissionsMutations.permissionsAdd, doc);

    // remove permission
    checkLogin(permissionsMutations.permissionsRemove, { ids: [_permission._id] });
  });

  test('Create permission', async () => {
    Permissions.createPermission = jest.fn();
    await permissionsMutations.permissionsAdd({}, doc, { user: _user });

    expect(Permissions.createPermission).toBeCalledWith(doc);
    expect(Permissions.createPermission.mock.calls.length).toBe(1);
  });

  test('Remove permission', async () => {
    Permissions.removePermission = jest.fn();
    await permissionsMutations.permissionsRemove({}, { ids: [_permission.id] }, { user: _user });

    expect(Permissions.removePermission.mock.calls.length).toBe(1);
  });
});
