import * as sinon from 'sinon';
import { graphqlRequest } from '../db/connection';
import { customerFactory, importHistoryFactory } from '../db/factories';
import { ImportHistory } from '../db/models';
import * as workerUtils from '../workers/utils';

import './setup.ts';

describe('Import history mutations', () => {
  afterEach(async () => {
    // Clearing test data
    await ImportHistory.deleteMany({});
  });

  test('Remove import histories', async () => {
    const mutation = `
      mutation importHistoriesRemove($_id: String!) {
        importHistoriesRemove(_id: $_id)
      }
    `;
    const customer = await customerFactory({});

    const importHistory = await importHistoryFactory({ ids: [customer._id] });

    const mock = sinon.stub(workerUtils, 'createWorkers').callsFake();

    await graphqlRequest(mutation, 'importHistoriesRemove', { _id: importHistory._id });

    const historyObj = await ImportHistory.getImportHistory(importHistory._id);

    expect(historyObj.status).toBe('Removing');

    mock.restore();
  });

  test('Cancel import history', async () => {
    const mutation = `
      mutation importHistoriesCancel($_id: String!) {
        importHistoriesCancel(_id: $_id)
      }
    `;
    const importHistory = await importHistoryFactory({});

    process.env.WORKERS_API_DOMAIN = 'http://fake';

    const response = await graphqlRequest(mutation, 'importHistoriesCancel', { _id: importHistory._id });

    expect(response).toBe(true);

    // if fakeId
    try {
      await graphqlRequest(mutation, 'importHistoriesCancel', { _id: 'fakeId' });
    } catch (e) {
      expect(e[0].message).toBe('History not found');
    }
  });
});
