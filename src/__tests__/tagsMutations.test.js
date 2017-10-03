/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Tags } from '../db/models';
import { brandFactory } from '../db/factories';
import tagsMutations from '../data/resolvers/mutations/tags';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Tags mutations', () => {
  let _tag;

  beforeEach(async () => {
    // Creating test data
    _tag = await brandFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await Tags.remove({});
  });

  test('Create tag', async () => {
    const tagObj = await tagsMutations.tagsAdd(
      {},
      { name: _tag.name, type: _tag.type, colorCode: _tag.colorCode },
      { user: _tag.userId },
    );

    expect(tagObj).toBeDefined();
  });

  test('Update tag', async () => {
    const tagObj = await tagsMutations.tagsEdit(
      {},
      { _id: _tag.id, name: _tag.name, type: _tag.type, colorCode: _tag.colorCode },
      { user: _tag.userId },
    );

    expect(tagObj).toBeDefined();
  });

  test('Delete tag', async () => {
    const isDeleted = await tagsMutations.tagsRemove({}, { _id: _tag.id }, { user: _tag.userId });
    expect(isDeleted).toBeTruthy();
  });
});
