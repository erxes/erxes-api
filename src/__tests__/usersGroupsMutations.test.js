/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { UsersGroups, Users } from '../db/models';
import { usersGroupFactory, userFactory } from '../db/factories';
import usersGroupMutations from '../data/resolvers/mutations/usersGroups';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test user groups mutations', () => {
  let _group, _user;
  const doc = {
    name: 'User group',
    description: 'group description',
  };

  beforeEach(async () => {
    // Creating test data
    _group = await usersGroupFactory();
    _user = await userFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await UsersGroups.remove({});
    await Users.remove({});
  });

  test('Create group', async () => {
    UsersGroups.createGroup = jest.fn();
    await usersGroupMutations.usersGroupsAdd({}, doc, { user: _user });

    expect(UsersGroups.createGroup).toBeCalledWith(doc);
    expect(UsersGroups.createGroup.mock.calls.length).toBe(1);
  });

  test('Update group', async () => {
    UsersGroups.updateGroup = jest.fn();
    await usersGroupMutations.usersGroupsEdit(null, { _id: _group._id, ...doc }, { user: _user });

    expect(UsersGroups.updateGroup).toBeCalledWith(_group._id, doc);
    expect(UsersGroups.updateGroup.mock.calls.length).toBe(1);
  });

  test('Remove group', async () => {
    UsersGroups.removeGroup = jest.fn();
    await usersGroupMutations.usersGroupsRemove({}, { _id: _group.id }, { user: _user });

    expect(UsersGroups.removeGroup.mock.calls.length).toBe(1);
  });
});
