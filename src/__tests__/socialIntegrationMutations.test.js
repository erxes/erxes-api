/* eslint-env mocha */
/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { INTEGRATION_KIND_CHOICES } from '../data/constants';
import twitter from '../data/integrations/twitter';
import { userFactory, brandFactory } from '../db/factories';
import { Brands, FacebookIntegrations, Integrations, Users } from '../db/models';
import integrationMutations from '../data/resolvers/mutations/integrations';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('social methods', () => {
  let _user;
  let _userId;
  let _brandId;

  beforeAll(async () => {
    _user = await userFactory({});
    _userId = _user._id;
  });

  afterAll(async () => {
    await Users.remove({});
  });

  describe('add facebook', () => {
    const name = 'Facebook';
    const appId = '24242424242';
    const pageIds = ['9934324242424242', '42424242424'];
    let inputDoc = {};

    const retValue = {
      testField1: 'testField 1',
      testField2: 'testField 2',
    };

    beforeAll(async () => {
      FacebookIntegrations.createIntegration = jest.fn(
        () =>
          new Promise(resolve => {
            resolve(retValue);
          }),
      );

      _brandId = (await brandFactory({ userId: _userId }))._id;
      inputDoc = {
        name,
        brandId: _brandId,
        appId,
        pageIds,
      };
    });

    afterAll(async () => {
      await Integrations.remove({});
      await Brands.remove({});
      // unwrap the spy
      if (twitter.trackIntegration.restore) {
        twitter.trackIntegration.restore();
        twitter.authenticate.restore();
      }

      _brandId = null;
    });

    it('add facebook', async () => {
      const res = await integrationMutations.integrationsAddFacebookIntegration(null, inputDoc, {
        user: _user,
      });

      expect(res).toBe(retValue);

      expect(FacebookIntegrations.createIntegration).toBeCalledWith({
        name,
        brandId: _brandId,
        facebookData: {
          appId,
          pageIds,
        },
      });

      expect(FacebookIntegrations.createIntegration.mock.calls.length).toBe(1);
    });
  });

  describe('add twister', () => {
    const twitterUserId = 24242424244242;

    beforeAll(async () => {
      twitter.authenticate = jest.fn((queryString, callback) => {
        callback({
          name: 'Twitter',
          twitterData: {
            // authenticated user's twitter id,
            id: twitterUserId,
            token: 'access_token',
            tokenSecret: 'auth.token_secret',
          },
        });
      });

      // stub track twitter integration
      twitter.trackIntegration = jest.fn(() => {});

      _brandId = (await brandFactory({ userId: _userId }))._id;
    });

    afterAll(async () => {
      await Brands.remove({});

      _brandId = null;
    });

    it('add twitter', async () => {
      const integration = await integrationMutations.integrationsAddTwitterIntegration(
        null,
        {
          brandId: _brandId,
          queryParams: {},
        },
        { user: _user },
      );

      // check field values
      expect(integration.kind).toBe(INTEGRATION_KIND_CHOICES.TWITTER);
      expect(integration.brandId).toBe(_brandId);
      expect(integration.twitterData.id).toBe(twitterUserId);
      expect(integration.twitterData.token).toBe('access_token');
      expect(integration.twitterData.tokenSecret).toBe('auth.token_secret');
    });
  });
});
