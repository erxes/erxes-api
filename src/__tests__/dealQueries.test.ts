import * as moment from 'moment';
import { graphqlRequest } from '../db/connection';
import {
  boardFactory,
  companyFactory,
  conformityFactory,
  customerFactory,
  dealFactory,
  fieldFactory,
  pipelineFactory,
  pipelineLabelFactory,
  productFactory,
  stageFactory,
  userFactory,
} from '../db/factories';
import { Deals } from '../db/models';

import './setup.ts';

describe('dealQueries', () => {
  let board;
  let pipeline;
  let stage;

  const commonDealTypes = `
    _id
    name
    stageId
    assignedUserIds
    amount
    closeDate
    description
    companies { _id }
    customers { _id }
    products
    productsData
    assignedUsers { _id }
    labels { _id }
    hasNotified
    isWatched
    stage { _id }
    boardId
    pipeline { _id }
  `;

  const qryDealFilter = `
    query deals(
      $search: String
      $stageId: String
      $assignedUserIds: [String]
      $customerIds: [String]
      $companyIds: [String]
      $productIds: [String]
      $nextDay: String
      $nextWeek: String
      $nextMonth: String
      $noCloseDate: String
      $overdue: String
      $mainType: String
      $mainTypeId: String
      $isRelated: Boolean
      $isSaved: Boolean
      $pipelineId: String
      $date: ItemDate
      $labelIds: [String]
      $initialStageId: String
    ) {
      deals(
        search: $search
        stageId: $stageId
        customerIds: $customerIds
        assignedUserIds: $assignedUserIds
        companyIds: $companyIds
        productIds: $productIds
        nextDay: $nextDay
        nextWeek: $nextWeek
        nextMonth: $nextMonth
        noCloseDate: $noCloseDate
        overdue: $overdue
        conformityMainType: $mainType
        conformityMainTypeId: $mainTypeId
        conformityIsRelated: $isRelated
        conformityIsSaved: $isSaved
        pipelineId: $pipelineId
        date: $date
        labelIds: $labelIds
        initialStageId: $initialStageId
      ) {
        ${commonDealTypes}
      }
    }
  `;

  beforeEach(async () => {
    // Creating test data
    board = await boardFactory();
    pipeline = await pipelineFactory({ boardId: board._id });
    stage = await stageFactory({ pipelineId: pipeline._id });
  });

  afterEach(async () => {
    // Clearing test data
    await Deals.deleteMany({});
  });

  test('Filter by initialStageId', async () => {
    await dealFactory({ stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { initialStageId: stage._id });

    expect(response.length).toBe(1);
  });

  test('Filter by search', async () => {
    await dealFactory({ searchText: 'name', stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { search: 'name' });

    expect(response.length).toBe(1);
  });

  test('Filter by next day', async () => {
    const tomorrow = moment()
      .add(1, 'day')
      .endOf('day')
      .format('YYYY-MM-DD');

    await dealFactory({ closeDate: new Date(tomorrow), stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { nextDay: 'true' });

    expect(response.length).toBe(1);
  });

  test('Deal filter by next week', async () => {
    const nextWeek = moment()
      .day(8)
      .format('YYYY-MM-DD');

    await dealFactory({ closeDate: new Date(nextWeek), stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { nextWeek: 'true' });

    expect(response.length).toBe(1);
  });

  test('Deal filter by next month', async () => {
    const nextMonth = moment()
      .add(1, 'months')
      .format('YYYY-MM-01');

    await dealFactory({ closeDate: new Date(nextMonth), stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { nextMonth: 'true' });

    expect(response.length).toBe(1);
  });

  test('Deal filter by has no close date', async () => {
    await dealFactory({ noCloseDate: true, stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { noCloseDate: 'true' });

    expect(response.length).toBe(1);
  });

  test('Deal filter by overdue', async () => {
    const yesterday = moment()
      .utc()
      .subtract(1, 'days')
      .toDate();

    await dealFactory({ closeDate: yesterday, stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { overdue: 'true' });

    expect(response.length).toBe(1);
  });

  test('Deal filter by products', async () => {
    const field1 = await fieldFactory({ contentType: 'product' });

    if (!field1) {
      throw new Error('Field not found');
    }

    const customFieldsData = { [field1._id]: 'text' };

    const product = await productFactory({ customFieldsData });
    const productId = product._id;

    const productsData = [
      {
        productId: product._id,
        currency: 'USD',
        amount: 200,
      },
      {
        productId: product._id,
        currency: 'USD',
      },
      {
        productId: product._id,
      },
    ];

    await dealFactory({ productsData, stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { productIds: [productId] });

    expect(response.length).toBe(1);
  });

  test('Deal filter by team members', async () => {
    const { _id } = await userFactory();

    await dealFactory({ assignedUserIds: [_id], stageId: stage._id });

    let response = await graphqlRequest(qryDealFilter, 'deals', { assignedUserIds: [_id] });

    expect(response.length).toBe(1);

    await dealFactory({ stageId: stage._id });

    // Filter by assigned to no one
    response = await graphqlRequest(qryDealFilter, 'deals', { assignedUserIds: [''] });

    expect(response.length).toBe(0);
  });

  test('Deal filter by customers', async () => {
    const { _id } = await customerFactory();
    const deal = await dealFactory({ stageId: stage._id });

    await conformityFactory({
      mainType: 'deal',
      mainTypeId: deal._id,
      relType: 'customer',
      relTypeId: _id,
    });

    let response = await graphqlRequest(qryDealFilter, 'deals', { customerIds: [_id] });

    expect(response.length).toBe(1);

    const customer1 = await customerFactory();

    response = await graphqlRequest(qryDealFilter, 'deals', { customerIds: [customer1._id] });

    expect(response.length).toBe(0);
  });

  test('Deal filter by companies', async () => {
    const { _id } = await companyFactory();

    const deal = await dealFactory({ stageId: stage._id });

    await conformityFactory({
      mainType: 'company',
      mainTypeId: _id,
      relType: 'deal',
      relTypeId: deal._id,
    });

    let response = await graphqlRequest(qryDealFilter, 'deals', { companyIds: [_id] });

    expect(response.length).toBe(1);

    const company1 = await companyFactory();

    response = await graphqlRequest(qryDealFilter, 'deals', { companyIds: [company1._id] });

    expect(response.length).toBe(0);
  });

  test('Deal filter by label', async () => {
    const { _id } = await pipelineLabelFactory();

    await dealFactory({ labelIds: [_id], stageId: stage._id });

    const response = await graphqlRequest(qryDealFilter, 'deals', { labelIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Deal filter by date', async () => {
    const date = new Date();
    await dealFactory({ closeDate: date, stageId: stage._id });

    const args = {
      date: { year: date.getFullYear(), month: date.getMonth() },
      pipelineId: pipeline._id,
    };

    const response = await graphqlRequest(qryDealFilter, 'deals', args);

    expect(response.length).toBe(1);
  });

  test('Deals', async () => {
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
    const user = await userFactory();
    const deal = await dealFactory({ stageId: stage._id, watchedUserIds: [user._id] });

    const qry = `
      query dealDetail($_id: String!) {
        dealDetail(_id: $_id) {
          ${commonDealTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'dealDetail', { _id: deal._id }, { user });

    expect(response._id).toBe(deal._id);
    expect(response.isWatched).toBe(true);
  });

  test('Deal total amount', async () => {
    const product = await productFactory();
    const productsData = [
      {
        productId: product._id,
        currency: 'USD',
        amount: 200,
      },
    ];

    const args = {
      stageId: stage._id,
      productsData,
    };

    await dealFactory(args);
    await dealFactory(args);
    await dealFactory(args);

    const filter = { pipelineId: pipeline._id };

    const qry = `
      query dealsTotalAmounts($pipelineId: String!) {
        dealsTotalAmounts(pipelineId: $pipelineId) {
          _id
          dealCount
          totalForType {
            _id
            name
            currencies {
              name
              amount
            }
          }
        }
      }
    `;

    const response = await graphqlRequest(qry, 'dealsTotalAmounts', filter);

    expect(response.dealCount).toBe(3);
    expect(response.dealCount).toBe(3);
    expect(response.totalForType[0].currencies[0].name).toBe('USD');
    expect(response.totalForType[0].currencies[0].amount).toBe(600);
  });

  test('Deal (=ticket, task) filter by conformity saved and related', async () => {
    const { _id } = await companyFactory();

    const deal = await dealFactory({ stageId: stage._id });
    await dealFactory({});
    await customerFactory({});
    await companyFactory({});

    let response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'company',
      mainTypeId: _id,
      isSaved: true,
    });

    expect(response.length).toBe(0);

    response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'company',
      mainTypeId: _id,
      isRelated: true,
    });

    expect(response.length).toBe(0);

    await conformityFactory({
      mainType: 'company',
      mainTypeId: _id,
      relType: 'deal',
      relTypeId: deal._id,
    });

    const customer = await customerFactory({});
    await conformityFactory({
      mainType: 'company',
      mainTypeId: _id,
      relType: 'customer',
      relTypeId: customer._id,
    });

    response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'company',
      mainTypeId: _id,
      isSaved: true,
    });

    expect(response.length).toBe(1);

    response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'company',
      mainTypeId: _id,
      isRelated: true,
    });

    expect(response.length).toBe(0);

    response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'customer',
      mainTypeId: customer._id,
      isSaved: true,
    });

    expect(response.length).toBe(0);

    response = await graphqlRequest(qryDealFilter, 'deals', {
      mainType: 'customer',
      mainTypeId: customer._id,
      isRelated: true,
    });

    expect(response.length).toBe(1);
  });

  test('Deal filter by customers and companies', async () => {
    const customer = await customerFactory();
    const company = await companyFactory();
    const deal = await dealFactory({ stageId: stage._id });
    const deal1 = await dealFactory({ stageId: stage._id });
    const deal2 = await dealFactory({ stageId: stage._id });

    await conformityFactory({
      mainType: 'deal',
      mainTypeId: deal._id,
      relType: 'customer',
      relTypeId: customer._id,
    });

    await conformityFactory({
      mainType: 'company',
      mainTypeId: company._id,
      relType: 'deal',
      relTypeId: deal._id,
    });

    await conformityFactory({
      mainType: 'deal',
      mainTypeId: deal1._id,
      relType: 'customer',
      relTypeId: customer._id,
    });

    await conformityFactory({
      mainType: 'company',
      mainTypeId: company._id,
      relType: 'deal',
      relTypeId: deal2._id,
    });

    const response = await graphqlRequest(qryDealFilter, 'deals', {
      customerIds: [customer._id],
      companyIds: [company._id],
    });

    expect(response.length).toBe(1);
  });
});
