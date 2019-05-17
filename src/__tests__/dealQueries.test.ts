import { graphqlRequest } from '../db/connection';
import { dealFactory, stageFactory } from '../db/factories';

describe('dealQueries', () => {
  const commonDealTypes = `
    _id
    name
    stageId
    companyIds
    customerIds
    assignedUserIds
    amount
    closeDate
    description
    companies {
      _id
    }
    customers {
      _id
    }
    products
    productsData
    assignedUsers {
      _id
    }
  `;

  test('Deals', async () => {
    const stage = await stageFactory();

    const args = { stageId: stage._id };

    await dealFactory(args);
    await dealFactory(args);
    await dealFactory(args);

    const qry = `
      query deals($stageId: String!) {
        deals(stageId: $stageId) {
          ${commonDealTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'deals', args);

    expect(response.length).toBe(3);
  });

  test('Deal detail', async () => {
    const deal = await dealFactory();

    const args = { _id: deal._id };

    const qry = `
      query dealDetail($_id: String!) {
        dealDetail(_id: $_id) {
          ${commonDealTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'dealDetail', args);

    expect(response._id).toBe(deal._id);
  });
});
