import { Brands, Companies, Customers, Integrations, Segments, Tags } from '../../../db/models';
import { STATUSES } from '../../../db/models/definitions/constants';
import { ACTIVITY_CONTENT_TYPES, COC_LEAD_STATUS_TYPES, COC_LIFECYCLE_STATE_TYPES, TAG_TYPES } from '../../constants';
import { moduleRequireLogin } from '../../permissions';
import { cocsExport } from './cocExport';
import QueryBuilder from './segmentQueryBuilder';
import { paginate } from './utils';

interface IListArgs {
  page?: number;
  perPage?: number;
  segment?: string;
  tag?: string;
  ids?: string[];
  searchValue?: string;
  lifecycleState?: string;
  leadStatus?: string;
  sortField?: string;
  sortDirection?: number;
  brand?: string;
}

interface ICountArgs extends IListArgs {
  only?: string;
  byFakeSegment: any;
}

interface IIn {
  $in: string[];
}

interface IBrandFilter {
  _id: IIn;
}

interface ICountBy {
  [index: string]: number;
}

type TSortBuilder = { primaryName: number } | { [index: string]: number };

/*
 * Brand filter
 */
const brandFilter = async (brandId: string): Promise<IBrandFilter> => {
  const integrations = await Integrations.find({ brandId }, { _id: 1 });
  const integrationIds = integrations.map(i => i._id);

  const customers = await Customers.find({ integrationId: { $in: integrationIds } }, { companyIds: 1 });

  let companyIds: any = [];

  for (const customer of customers) {
    companyIds = [...companyIds, ...(customer.companyIds || [])];
  }

  return { _id: { $in: companyIds } };
};

const listQuery = async (params: IListArgs) => {
  let selector: any = {
    status: { $ne: STATUSES.DELETED },
  };

  // Filter by segments
  if (params.segment) {
    const segment = await Segments.findOne({ _id: params.segment });
    const query = await QueryBuilder.segments(segment);

    Object.assign(selector, query);
  }

  if (params.searchValue) {
    const fields = [
      { names: { $in: [new RegExp(`.*${params.searchValue}.*`, 'i')] } },
      { emails: { $in: [new RegExp(`.*${params.searchValue}.*`, 'i')] } },
      { phones: { $in: [new RegExp(`.*${params.searchValue}.*`, 'i')] } },
      { website: new RegExp(`.*${params.searchValue}.*`, 'i') },
      { industry: new RegExp(`.*${params.searchValue}.*`, 'i') },
      { plan: new RegExp(`.*${params.searchValue}.*`, 'i') },
    ];

    selector = { $or: fields };
  }

  // Filter by tag
  if (params.tag) {
    selector.tagIds = params.tag;
  }

  // filter directly using ids
  if (params.ids) {
    selector = { _id: { $in: params.ids } };
  }

  // filter by lead status
  if (params.leadStatus) {
    selector.leadStatus = params.leadStatus;
  }

  // filter by life cycle state
  if (params.lifecycleState) {
    selector.lifecycleState = params.lifecycleState;
  }

  // filter by brandId
  if (params.brand) {
    selector = { ...selector, ...(await brandFilter(params.brand)) };
  }

  return selector;
};

const sortBuilder = (params: IListArgs): TSortBuilder => {
  const sortField = params.sortField;
  const sortDirection = params.sortDirection || 0;

  let sortParams: TSortBuilder = { primaryName: -1 };

  if (sortField) {
    sortParams = { [sortField]: sortDirection };
  }

  return sortParams;
};

const count = async (query: any, args: ICountArgs) => {
  const selector = await listQuery(args);

  const findQuery = { ...selector, ...query };

  return Companies.find(findQuery).countDocuments();
};

const countBySegment = async (args: ICountArgs): Promise<ICountBy> => {
  const counts = {};

  // Count companies by segments =========
  const segments = await Segments.find({
    contentType: ACTIVITY_CONTENT_TYPES.COMPANY,
  });

  for (const s of segments) {
    counts[s._id] = await count(await QueryBuilder.segments(s), args);
  }

  return counts;
};

const countByTags = async (args: ICountArgs): Promise<ICountBy> => {
  const counts = {};

  // Count companies by tag =========
  const tags = await Tags.find({ type: TAG_TYPES.COMPANY });

  for (const tag of tags) {
    counts[tag._id] = await count({ tagIds: tag._id }, args);
  }

  return counts;
};

const countByBrands = async (args: ICountArgs): Promise<ICountBy> => {
  const counts = {};

  // Count companies by brand =========
  const brands = await Brands.find({});

  for (const brand of brands) {
    counts[brand._id] = await count(await brandFilter(brand._id), args);
  }

  return counts;
};

const companyQueries = {
  /**
   * Companies list
   */
  async companies(_root, params: IListArgs) {
    const selector = await listQuery(params);
    const sort = sortBuilder(params);

    return paginate(Companies.find(selector), params).sort(sort);
  },

  /**
   * Companies for only main list
   */
  async companiesMain(_root, params: IListArgs) {
    const selector = await listQuery(params);
    const sort = sortBuilder(params);

    const list = await paginate(Companies.find(selector).sort(sort), params);
    const totalCount = await Companies.find(selector).countDocuments();

    return { list, totalCount };
  },

  /**
   * Group company counts by segments
   */
  async companyCounts(_root, args: ICountArgs) {
    const counts = {
      bySegment: {},
      byFakeSegment: 0,
      byTag: {},
      byBrand: {},
      byLeadStatus: {},
      byLifecycleState: {},
    };

    const { only } = args;

    switch (only) {
      case 'byTag':
        counts.byTag = await countByTags(args);
        break;
      case 'bySegment':
        counts.bySegment = await countBySegment(args);
        break;
      case 'byBrand':
        counts.byBrand = await countByBrands(args);
        break;
      case 'byLeadStatus':
        {
          // Count companies by lead status ======
          for (const status of COC_LEAD_STATUS_TYPES) {
            counts.byLeadStatus[status] = await count({ leadStatus: status }, args);
          }
        }
        break;
      case 'byLifecycleState':
        {
          // Count companies by life cycle state =======
          for (const state of COC_LIFECYCLE_STATE_TYPES) {
            counts.byLifecycleState[state] = await count({ lifecycleState: state }, args);
          }
        }
        break;
    }

    // Count companies by fake segment
    if (args.byFakeSegment) {
      counts.byFakeSegment = await count(await QueryBuilder.segments(args.byFakeSegment), args);
    }

    return counts;
  },

  /**
   * Get one company
   */
  companyDetail(_root, { _id }: { _id: string }) {
    return Companies.findOne({ _id });
  },

  /**
   * Export companies to xls file
   */
  async companiesExport(_root, params: IListArgs) {
    const selector = await listQuery(params);
    const sort = sortBuilder(params);
    const companies = await paginate(Companies.find(selector), params).sort(sort);

    return cocsExport(companies, 'company');
  },
};

moduleRequireLogin(companyQueries);

export default companyQueries;
