/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { UsersGroups } from '../db/models';
import { usersGroupFactory } from '../db/factories';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Test users group model', () => {
  let _group;
  const doc = {
    name: 'New Group',
    description: 'User group',
  };

  beforeEach(async () => {
    // Creating test data
    _group = await usersGroupFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await UsersGroups.remove({});
  });

  test('Create user group', async () => {
    const groupObj = await UsersGroups.createGroup(doc);

    expect(groupObj).toBeDefined();
    expect(groupObj.name).toEqual(doc.name);
    expect(groupObj.description).toEqual(doc.description);
  });

  test('Update group', async () => {
    const groupObj = await UsersGroups.updateGroup(_group._id, doc);

    expect(groupObj).toBeDefined();
    expect(groupObj.name).toEqual(doc.name);
    expect(groupObj.description).toEqual(doc.description);
  });

  test('Remove group', async () => {
    const isDeleted = await UsersGroups.removeGroup(_group.id);
    expect(isDeleted).toBeTruthy();
  });

  test('Remove group not found', async () => {
    try {
      await UsersGroups.removeGroup('groupId');
    } catch (e) {
      expect(e.message).toBe('Group not found with id groupId');
    }
  });
});
