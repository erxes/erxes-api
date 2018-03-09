/* eslint-env jest */

import usersGroupQueries from '../data/resolvers/queries/usersGroups';

describe('usersGroupQueries', () => {
  test(`test if Error('Login required') exception is working as intended`, async () => {
    expect.assertions(2);

    const expectError = async func => {
      try {
        await func(null, {}, {});
      } catch (e) {
        expect(e.message).toBe('Login required');
      }
    };

    expectError(usersGroupQueries.usersGroups);
    expectError(usersGroupQueries.usersGroupsTotalCount);
  });
});
