/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { permissionMutations, usersGroupMutations } from '../data/resolvers/mutations/permissions';
import { connect, disconnect, graphqlRequest } from '../db/connection';
import { permissionFactory, userFactory, usersGroupFactory } from '../db/factories';
import { Permissions, Users, UsersGroups } from '../db/models';
import { IUserGroup } from '../db/models/definitions/permissions';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test permissions mutations', () => {
  let _permission;
  let _user;
  let _group;

  const doc = {
    actions: ['up', ' test'],
    allowed: true,
    module: 'module name',
  };

  const docGroup = {
    name: 'User group',
    description: 'group description',
  };

  beforeEach(async () => {
    // Creating test data
    _permission = await permissionFactory();
    _group = await usersGroupFactory();
    _user = await userFactory({
      isOwner: true,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Permissions.remove({});
    await UsersGroups.remove({});
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
    checkLogin(permissionMutations.permissionsAdd, doc);

    // remove permission
    checkLogin(permissionMutations.permissionsRemove, { ids: [] });
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
    checkLogin(permissionMutations.permissionsAdd, doc);

    // remove permission
    checkLogin(permissionMutations.permissionsRemove, { ids: [_permission._id] });
  });

  test('Create permission', async () => {
    const mutation = `
      permissionsAdd(
        $module: String!,
        $actions: [String!]!,
        $userIds: [String!]!,
        $groupIds: [String!]!,
        $allowed: Boolean
      ) {
        permissionAdd(
          module: $module
          actions: $actions
          userIds: $userIds
          groupIds: $groupIds
          allowed: $allowed
        ) {
          _id: String!
          module: String
          action: String
          userId: String
          groupId: String
          requiredActions: [String]
          allowed: Boolean
          user: User
          group: UsersGroup
        }
      }
    `;

    // tslint:disable-next-line
    const Permission = await graphqlRequest(mutation, 'permissionAdd', doc, { user: _user });

    expect(Permission.createPermission).toBeCalledWith(doc);
    expect(Permission.module).toEqual('module name');
  });

  test('Remove permission', async () => {
    const mutation = `
      permissionsRemove($ids: [String]!) {
        permissionsRemove(ids: $ids) {
          _id
        }
      }
    `;

    await graphqlRequest(mutation, 'permissionsRemove', { ids: [_permission.id] }, { user: _user });

    expect(Permissions.find({ _id: _permission._id })).toBeFalsy();
  });

  test('Permission login required functions', async () => {
    const checkLogin = async (fn, args) => {
      try {
        await fn({}, args, {});
      } catch (e) {
        expect(e.message).toEqual('Login required');
      }
    };

    expect.assertions(3);

    // add group
    checkLogin(usersGroupMutations.usersGroupsAdd, docGroup);

    // edit group
    checkLogin(usersGroupMutations.usersGroupsEdit, { _id: _group._id, ...docGroup });

    // remove group
    checkLogin(usersGroupMutations.usersGroupsRemove, { ids: [] });
  });

  test(`test if Error('Permission required') error is working as intended`, async () => {
    const checkLogin = async (fn, args) => {
      try {
        await fn({}, args, { user: { _id: 'fakeId' } });
      } catch (e) {
        expect(e.message).toEqual('Permission required');
      }
    };

    expect.assertions(3);

    // add group
    checkLogin(usersGroupMutations.usersGroupsAdd, docGroup);

    // edit group
    checkLogin(usersGroupMutations.usersGroupsEdit, { _id: _group._id, ...docGroup });

    // remove group
    checkLogin(usersGroupMutations.usersGroupsRemove, { _id: _group._id });
  });

  test('Create group', async () => {
    const _doc = { name: 'created name', description: 'created description' };

    const mutation = `
      usersGroupsAdd($name: String! $description: String) {
        usersGroupsAdd(name: $name description: $description) {
          _id
          name
          description
        }
      }
    `;

    const createdGroup = await graphqlRequest(mutation, 'usersGroupsAdd', _doc, { user: _user });

    expect(createdGroup.name).toEqual('created name');
    expect(createdGroup.description).toEqual('created description');
  });

  test('Update group', async () => {
    const _doc: IUserGroup = { name: 'updated name', description: 'updated description' };

    const mutation = `
      mutation usersGroupsEdit($_id: String! $name: String $description: String) {
        usersGroupsEdit(_id: $_id name: $name description: $description) {
          _id
          name
          description
        }
      }
    `;

    const updatedGroup = await graphqlRequest(
      mutation,
      'usersGroupsEdit',
      { _id: _group._id, ..._doc },
      { user: _user },
    );

    expect(updatedGroup.name).toBe('updated name');
    expect(updatedGroup.description).toBe('updated description');
  });

  test('Remove group', async () => {
    const mutation = `
      mutation usersGroupsRemove($_id: String!) {
        usersGroupsRemove(_id: $_id)
      }
    `;

    await graphqlRequest(mutation, 'usersGroupsRemove', { _id: _group._id }, { user: _user });

    const removeGroup = await UsersGroups.findOne({ _id: _group._id });

    expect(removeGroup).toBeNull();
  });
});
