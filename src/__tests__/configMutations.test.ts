import { graphqlRequest } from '../db/connection';

import './setup.ts';

describe('Test configs mutations', () => {
  test('Insert config', async () => {
    const mutation = `
      mutation configsInsert($code: String!, $value: [String]!) {
        configsInsert(code: $code, value: $value) {
          _id
          code
          value
        }
      }
    `;

    let config = await graphqlRequest(mutation, 'configsInsert', {
      code: 'dealUOM',
      value: ['MNT'],
    });

    expect(config.value.length).toEqual(1);
    expect(config.value[0]).toEqual('MNT');

    // if code is not dealUOM and dealCurrency
    config = await graphqlRequest(mutation, 'configsInsert', {
      code: 'code',
      value: ['USD'],
    });

    expect(config.value.length).toEqual(1);
    expect(config.value[0]).toEqual('USD');
  });

  test('Insert config', async () => {
    process.env.ENGAGES_API_DOMAIN = 'http://localhost';

    const mutation = `
      mutation engagesConfigSave($accessKeyId: String, $secretAccessKey: String, $region: String) {
        engagesConfigSave(accessKeyId: $accessKeyId, secretAccessKey: $secretAccessKey, region: $region) {
          accessKeyId
          secretAccessKey
          region
        }
      }
    `;

    try {
      await graphqlRequest(mutation, 'engagesConfigSave');
    } catch (e) {
      expect(e[0].message).toBe('Engages api is not running');
    }
  });
});
