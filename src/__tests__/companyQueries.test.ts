import { graphqlRequest } from '../db/connection';
import {
  brandFactory,
  companyFactory,
  conformityFactory,
  customerFactory,
  integrationFactory,
  segmentFactory,
  tagsFactory,
} from '../db/factories';
import { Companies, Segments, Tags } from '../db/models';

import './setup.ts';

const count = response => {
  return Object.keys(response).length;
};

describe('companyQueries', () => {
  const commonParamDefs = `
    $page: Int
    $perPage: Int
    $segment: String
    $tag: String
    $ids: [String]
    $searchValue: String
    $lifecycleState: String
    $leadStatus: String
    $brand: String
  `;

  const commonParams = `
    page: $page
    perPage: $perPage
    segment: $segment
    tag: $tag
    ids: $ids
    searchValue: $searchValue
    lifecycleState: $lifecycleState
    leadStatus: $leadStatus
    brand: $brand
  `;

  const qryCompanies = `
    query companies(${commonParamDefs}) {
      companies(${commonParams}) {
        _id
      }
    }
  `;

  const qryCompaniesMain = `
    query companiesMain(${commonParamDefs}) {
      companiesMain(${commonParams}) {
        list {
          _id
          tagIds
          primaryName
          names
          industry
          plan
        }
        totalCount
      }
    }
  `;

  const qryCount = `
    query companyCounts(${commonParamDefs}, $only: String, $byFakeSegment: JSON) {
      companyCounts(${commonParams}, only: $only, byFakeSegment: $byFakeSegment)
    }
  `;

  const name = 'companyName';
  const plan = 'plan';

  afterEach(async () => {
    // Clearing test data
    await Companies.deleteMany({});
    await Tags.deleteMany({});
    await Segments.deleteMany({});
  });

  test('Companies', async () => {
    await companyFactory({});
    await companyFactory({});
    await companyFactory({});
    await companyFactory({});
    await companyFactory({});

    const args = { page: 1, perPage: 3 };
    const responses = await graphqlRequest(qryCompanies, 'companies', args);

    expect(responses.length).toBe(3);
  });

  test('Companies filtered by ids', async () => {
    const company1 = await companyFactory({});
    const company2 = await companyFactory({});
    const company3 = await companyFactory({});

    await companyFactory({});
    await companyFactory({});
    await companyFactory({});

    const ids = [company1._id, company2._id, company3._id];

    const responses = await graphqlRequest(qryCompanies, 'companies', { ids });

    expect(responses.length).toBe(3);
  });

  test('Companies filtered by tag', async () => {
    const tag = await tagsFactory();

    await companyFactory();
    await companyFactory();
    await companyFactory({ tagIds: [tag._id] });
    await companyFactory({ tagIds: [tag._id] });

    const tagResponse = await Tags.findOne({}, '_id');

    if (!tagResponse) {
      throw new Error('Tag response does not exist');
    }

    const responses = await graphqlRequest(qryCompanies, 'companies', {
      tag: tagResponse._id,
    });

    expect(responses.length).toBe(2);
  });

  test('Companies filtered by leadStatus', async () => {
    await companyFactory();
    await companyFactory();
    await companyFactory({ leadStatus: 'new' });
    await companyFactory({ leadStatus: 'new' });

    const responses = await graphqlRequest(qryCompanies, 'companies', {
      leadStatus: 'new',
    });

    expect(responses.length).toBe(2);
  });

  test('Companies filtered by lifecycleState', async () => {
    await companyFactory();
    await companyFactory();
    await companyFactory({ lifecycleState: 'subscriber' });
    await companyFactory({ lifecycleState: 'subscriber' });

    const responses = await graphqlRequest(qryCompanies, 'companies', {
      lifecycleState: 'subscriber',
    });

    expect(responses.length).toBe(2);
  });

  test('Companies filtered by segment', async () => {
    await companyFactory({ names: [name], primaryName: name });
    await companyFactory();
    await companyFactory();

    const args = {
      contentType: 'company',
      conditions: [
        {
          field: 'primaryName',
          operator: 'c',
          value: name,
          type: 'string',
        },
      ],
    };

    const segment = await segmentFactory(args);

    const response = await graphqlRequest(qryCompanies, 'companies', {
      segment: segment._id,
    });

    expect(response.length).toBe(1);
  });

  test('Companies filtered by search value', async () => {
    const phone = '99999999';
    const email = 'email@email.com';
    const website = 'www.google.com';

    await companyFactory({
      names: [name],
      plan,
      industry: 'Banks',
      website,
      emails: [email],
      phones: [phone],
    });

    // companies by name ==============
    let responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: name,
    });

    expect(responses.length).toBe(1);

    // companies by industry ==========
    responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: 'Banks',
    });

    expect(responses.length).toBe(1);

    // companies by plan ==============
    responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: plan,
    });

    expect(responses.length).toBe(1);

    // companies by website ==============
    responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: website,
    });

    expect(responses.length).toBe(1);

    // companies by email ==============
    responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: email,
    });

    expect(responses.length).toBe(1);

    // companies by phone ==============
    responses = await graphqlRequest(qryCompanies, 'companies', {
      searchValue: phone,
    });

    expect(responses.length).toBe(1);
  });

  test('Companies filtered by brandId', async () => {
    const brand = await brandFactory({});
    const integration = await integrationFactory({ brandId: brand._id });
    const integrationId = integration._id;

    const company1 = await companyFactory({});
    const company2 = await companyFactory({});
    await companyFactory({});

    const customer1 = await customerFactory({ integrationId });
    await conformityFactory({
      mainType: 'customer',
      mainTypeId: customer1.id,
      relType: 'company',
      relTypeId: company1._id,
    });
    const customer2 = await customerFactory({ integrationId });
    await conformityFactory({
      mainType: 'customer',
      mainTypeId: customer2.id,
      relType: 'company',
      relTypeId: company2._id,
    });

    const responses = await graphqlRequest(qryCompanies, 'companies', {
      brand: brand._id,
    });

    expect(responses.length).toBe(2);
  });

  test('Main companies', async () => {
    await companyFactory({});
    await companyFactory({});
    await companyFactory({});
    await companyFactory({});

    const args = { page: 1, perPage: 3 };
    const responses = await graphqlRequest(qryCompaniesMain, 'companiesMain', args);

    expect(responses.list.length).toBe(3);
    expect(responses.totalCount).toBe(4);
  });

  test('Count companies by segment', async () => {
    // Creating test data
    await companyFactory({});
    await companyFactory({});

    await segmentFactory({ contentType: 'company' });

    let response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'bySegment',
    });

    expect(count(response.bySegment)).toBe(1);

    const args: any = {
      contentType: 'company',
      conditions: [
        {
          field: 'primaryName',
          operator: 'c',
          value: name,
          type: 'date',
        },
      ],
    };

    await segmentFactory(args);

    try {
      response = await graphqlRequest(qryCount, 'companyCounts', {
        only: 'bySegment',
      });
    } catch (e) {
      expect(e[0].message).toBe('TypeError: str.replace is not a function');
    }
  });

  test('Company count by segment (CastError)', async () => {
    await companyFactory({});
    await companyFactory({});

    const args = {
      contentType: 'company',
      conditions: [
        {
          field: 'size',
          operator: 'igt',
          value: name,
          type: 'string',
        },
      ],
    };

    const segment = await segmentFactory(args);

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'bySegment',
    });

    expect(response.bySegment[segment._id]).toBe(0);
  });

  test('Company count by tag', async () => {
    await companyFactory({});
    await companyFactory({});

    await tagsFactory({ type: 'company' });
    await tagsFactory({ type: 'customer' });

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'byTag',
    });

    expect(count(response.byTag)).toBe(1);
  });

  test('Company count by leadStatus', async () => {
    await companyFactory({});
    await companyFactory({});
    await companyFactory({ leadStatus: 'new' });
    await companyFactory({ leadStatus: 'new' });

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'byLeadStatus',
    });

    expect(response.byLeadStatus.open).toBe(2);
    expect(response.byLeadStatus.new).toBe(2);
  });

  test('Company count by lifecycleState', async () => {
    await companyFactory({});
    await companyFactory({});
    await companyFactory({ lifecycleState: 'subscriber' });
    await companyFactory({ lifecycleState: 'subscriber' });

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'byLifecycleState',
    });

    expect(response.byLifecycleState.subscriber).toBe(2);
    expect(response.byLifecycleState.lead).toBe(2);
  });

  test('Company count by brand', async () => {
    const brand = await brandFactory({});
    const integration = await integrationFactory({ brandId: brand._id });
    const integrationId = integration._id;

    const company1 = await companyFactory({});
    const company2 = await companyFactory({});
    await companyFactory({});

    const customer1 = await customerFactory({ integrationId });
    await conformityFactory({
      mainType: 'customer',
      mainTypeId: customer1.id,
      relType: 'company',
      relTypeId: company1._id,
    });
    const customer2 = await customerFactory({ integrationId });
    await conformityFactory({
      mainType: 'customer',
      mainTypeId: customer2.id,
      relType: 'company',
      relTypeId: company2._id,
    });

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      only: 'byBrand',
    });

    expect(response.byBrand[brand._id]).toBe(2);
  });

  test('Company count by fake segment', async () => {
    await companyFactory({});
    await companyFactory({});

    await segmentFactory({ contentType: 'company' });
    await segmentFactory();

    const response = await graphqlRequest(qryCount, 'companyCounts', {
      byFakeSegment: {},
    });

    expect(count(response.bySegment)).toBe(0);
  });

  test('Company detail', async () => {
    const company = await companyFactory();

    const qry = `
      query companyDetail($_id: String!) {
        companyDetail(_id: $_id) {
          _id
          createdAt
          modifiedAt

          primaryName
          names
          size
          industry
          plan

          parentCompanyId
          primaryEmail
          emails
          ownerId
          primaryPhone
          phones
          leadStatus
          lifecycleState
          businessType
          description
          doNotDisturb
          links {
            linkedIn
            twitter
            facebook
            github
            youtube
            website
          }
          customers { _id }
          owner { _id }
          parentCompany { _id }

          tagIds

          customFieldsData

          getTags { _id }
        }
      }
    `;

    const response = await graphqlRequest(qry, 'companyDetail', {
      _id: company._id,
    });

    expect(response._id).toBe(company._id);
  });
});
