import * as sinon from 'sinon';
import { graphqlRequest } from '../db/connection';
import { companyFactory, customerFactory, importHistoryFactory, productFactory } from '../db/factories';
import { ImportHistory } from '../db/models';
import * as workerUtils from '../workers/utils';

import utils from '../data/utils';
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
    const company = await companyFactory();
    const product = await productFactory();

    const history = await importHistoryFactory({ ids: [customer._id], contentType: 'not-supported' });
    const customerHistory = await importHistoryFactory({ ids: [customer._id], contentType: 'customer' });
    const companyHistory = await importHistoryFactory({ ids: [company._id], contentType: 'company' });
    const productHistory = await importHistoryFactory({ ids: [product._id], contentType: 'product' });

    const mock = sinon.stub(workerUtils, 'createWorkers').callsFake();

    try {
      await graphqlRequest(mutation, 'importHistoriesRemove', { _id: history._id });
    } catch (e) {
      expect(e[0].message).toBe(
        'Error: Failed to connect workers api. Check WORKERS_API_DOMAIN env or workers api is not running',
      );
    }

    await graphqlRequest(mutation, 'importHistoriesRemove', { _id: customerHistory._id });
    await graphqlRequest(mutation, 'importHistoriesRemove', { _id: companyHistory._id });
    await graphqlRequest(mutation, 'importHistoriesRemove', { _id: productHistory._id });

    const historyObj = await ImportHistory.getImportHistory(customerHistory._id);

    expect(historyObj.status).toBe('Removing');

    mock.restore();
  });

  test('Remove import histories (Error)', async () => {
    const mutation = `
      mutation importHistoriesRemove($_id: String!) {
        importHistoriesRemove(_id: $_id)
      }
    `;

    const customer = await customerFactory({});

    const importHistory = await importHistoryFactory({ ids: [customer._id] });

    try {
      await graphqlRequest(mutation, 'importHistoriesRemove', { _id: importHistory._id });
    } catch (e) {
      expect(e[0].message).toBe(
        'Error: Failed to connect workers api. Check WORKERS_API_DOMAIN env or workers api is not running',
      );
    }
  });

  test('Cancel import history', async () => {
    const mutation = `
      mutation importHistoriesCancel($_id: String!) {
        importHistoriesCancel(_id: $_id)
      }
    `;

    const importHistory = await importHistoryFactory({});

    try {
      await graphqlRequest(mutation, 'importHistoriesCancel', { _id: importHistory._id });
    } catch (e) {
      expect(e[0].message).toBe(
        'Error: Failed to connect workers api. Check WORKERS_API_DOMAIN env or workers api is not running',
      );
    }

    const response = await graphqlRequest(mutation, 'importHistoriesCancel', { _id: importHistory._id });

    expect(response).toBe(true);

    // if fakeId
    try {
      await graphqlRequest(mutation, 'importHistoriesCancel', { _id: 'fakeId' });
    } catch (e) {
      expect(e[0].message).toBe('History not found');
    }
  });

  test('Cancel import history (Error)', async () => {
    const mutation = `
      mutation importHistoriesCancel($_id: String!) {
        importHistoriesCancel(_id: $_id)
      }
    `;

    const importHistory = await importHistoryFactory({});

    try {
      await graphqlRequest(mutation, 'importHistoriesRemove', { _id: importHistory._id });
    } catch (e) {
      expect(e[0].message).toBe(
        'Error: Failed to connect workers api. Check WORKERS_API_DOMAIN env or workers api is not running',
      );
    }
  });
});
