import { graphqlRequest } from '../db/connection';
import { configFactory } from '../db/factories';

import './setup.ts';

describe('configQueries', () => {
  test('config detail', async () => {
    const config = await configFactory();

    const args = { code: config.code };

    const qry = `
      query configsDetail($code: String!) {
        configsDetail(code: $code) {
          _id
          code
          value
        }
      }
    `;

    const response = await graphqlRequest(qry, 'configsDetail', args);

    expect(response.code).toBe(config.code);
  });

  test('config versions', async () => {
    const qry = `
      query configsVersions {
        configsVersions {
          erxesVersion {
            packageVersion
            branch
            sha
            abbreviatedSha
          }
        }
      }
    `;

    const response = await graphqlRequest(qry, 'configsVersions');

    // expect(response).toBe({});

    console.log('response: ', response);
  });
});
