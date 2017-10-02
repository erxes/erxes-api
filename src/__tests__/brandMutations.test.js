/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { Brands } from '../db/models';
import { brandFactory } from '../db/factories';
import brandMutations from '../data/resolvers/mutations/brands';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Brands mutations', () => {
  let _brand;

  beforeEach(async () => {
    // Creating test data
    _brand = await brandFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await Brands.remove({});
  });

  test('Create brand', async () => {
    const brandObj = await brandMutations.brandsAdd(
      {},
      { code: _brand.code, name: _brand.name },
      { user: _brand.userId },
    );

    expect(brandObj).toBeDefined();
  });

  test('Update brand', async () => {
    const brandObj = await brandMutations.brandsEdit(
      {},
      { _id: _brand.id, code: _brand.code, name: _brand.name },
      { user: _brand.userId },
    );

    expect(brandObj).toBeDefined();
  });

  test('Delete brand', async () => {
    const isDeleted = await brandMutations.brandsRemove(
      {},
      { _id: _brand.id },
      { user: _brand.userId },
    );
    expect(isDeleted).toBeTruthy();
  });

  test('Update brand email config', async () => {
    const brandObj = await brandMutations.brandsConfigEmail(
      {},
      { _id: _brand.id, config: _brand.emailConfig },
      { user: _brand.userId },
    );
    expect(brandObj).toBeDefined();
  });
});
