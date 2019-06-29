import { Brands, Customers, Forms, Integrations, Segments, Tags } from '../../../db/models';
import { ACTIVITY_CONTENT_TYPES, TAG_TYPES } from '../../../db/models/definitions/constants';
import { ISegment } from '../../../db/models/definitions/segments';
import { COC_LEAD_STATUS_TYPES, COC_LIFECYCLE_STATE_TYPES, INTEGRATION_KIND_CHOICES } from '../../constants';
import { Builder as BuildQuery, IListArgs, sortBuilder } from '../../modules/coc/customers';
import QueryBuilder from '../../modules/segments/queryBuilder';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';
import { paginate } from '../../utils';

interface ICountBy {
  [index: string]: number;
}

interface ICountParams extends IListArgs {
  only: string;
}

const count = (query, mainQuery) => {
  const findQuery = { $and: [mainQuery, query] };

  return Customers.find(findQuery).countDocuments();
};

const countBySegment = async (qb: any, mainQuery: any): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by segments
  const segments = await Segments.find({
    contentType: ACTIVITY_CONTENT_TYPES.CUSTOMER,
  });

  // Count customers by segment
  for (const s of segments) {
    try {
      counts[s._id] = await count(await qb.segmentFilter(s._id), mainQuery);
    } catch (e) {
      // catch mongo error
      if (e.name === 'CastError') {
        counts[s._id] = 0;
      } else {
        throw new Error(e);
      }
    }
  }

  return counts;
};

const countByBrand = async (qb: any, mainQuery: any): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by brand
  const brands = await Brands.find({});

  for (const brand of brands) {
    counts[brand._id] = await count(await qb.brandFilter(brand._id), mainQuery);
  }

  return counts;
};

const countByIntegration = async (mainQuery: any): Promise<ICountBy> => {
  const counts: ICountBy = {};
  const integrationIds = await Integrations.find({ kind: { $in: INTEGRATION_KIND_CHOICES.ALL } }).select({
    _id: 1,
    name: 1,
    kind: 1,
  });
  const integrationMap = {};
  const rawIntegrationIds: any = [];
  integrationIds.forEach(element => {
    rawIntegrationIds.push(element._id);
    integrationMap[element._id] = element.kind;
    if (element.kind) {
      counts[element.kind] = 0;
    }
  });

  const query = { integrationId: { $in: rawIntegrationIds } };
  const findQuery = { $and: [mainQuery, query] };
  const countData = await Customers.aggregate([
    {
      $match: findQuery,
    },
    {
      $group: {
        _id: '$integrationId',
        count: { $sum: 1 },
      },
    },
  ]);

  countData.forEach(element => {
    const kind = integrationMap[element._id];
    counts[kind] += element.count;
  });

  return counts;
};

const countByTag = async (mainQuery: any): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by tag
  const tags = await Tags.find({ type: TAG_TYPES.CUSTOMER }).select('_id');
  const tagRawIds = tags.map(row => row._id);

  const tagCountData = await Customers.aggregate([
    {
      $match: mainQuery,
    },
    {
      $project: {
        tagIds: 1,
        _id: 0,
      },
    },
    {
      $unwind: '$tagIds',
    },
    {
      $match: { tagIds: { $in: tagRawIds } },
    },
    {
      $group: {
        _id: '$tagIds',
        count: { $sum: 1 },
      },
    },
  ]);

  tagCountData.forEach(row => {
    counts[row._id] = row.count;
  });

  return counts;
};

const countByForm = async (qb: any, mainQuery: any, params: any): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by submitted form
  const forms = await Forms.find({});

  for (const form of forms) {
    counts[form._id] = await count(await qb.formFilter(form._id, params.startDate, params.endDate), mainQuery);
  }

  return counts;
};

const customerQueries = {
  /**
   * Customers list
   */
  async customers(_root, params: IListArgs) {
    const qb = new BuildQuery(params);

    await qb.buildAllQueries();

    const sort = sortBuilder(params);

    return paginate(Customers.find(qb.mainQuery()).sort(sort), params);
  },

  /**
   * Customers for only main list
   */
  async customersMain(_root, params: IListArgs) {
    const qb = new BuildQuery(params);

    await qb.buildAllQueries();

    const sort = sortBuilder(params);

    const list = await paginate(Customers.find(qb.mainQuery()).sort(sort), params);
    const totalCount = await Customers.find(qb.mainQuery()).countDocuments();

    return { list, totalCount };
  },

  /**
   * Group customer counts by brands, segments, integrations, tags
   */
  async customerCounts(_root, params: ICountParams) {
    const { only } = params;

    const counts = {
      bySegment: {},
      byBrand: {},
      byIntegrationType: {},
      byTag: {},
      byFakeSegment: 0,
      byForm: {},
      byLeadStatus: {},
      byLifecycleState: {},
    };

    const qb = new BuildQuery(params);

    await qb.buildAllQueries();

    let mainQuery = qb.mainQuery();

    // if passed at least one filter other than perPage
    // then find all filtered customers then add subsequent filter to it
    if (Object.keys(params).length > 1) {
      const customers = await Customers.find(qb.mainQuery(), { _id: 1 });
      const customerIds = customers.map(customer => customer._id);

      mainQuery = { _id: { $in: customerIds } };
    }

    switch (only) {
      case 'bySegment':
        counts.bySegment = await countBySegment(qb, mainQuery);
        break;

      case 'byBrand':
        counts.byBrand = await countByBrand(qb, mainQuery);
        break;

      case 'byTag':
        counts.byTag = await countByTag(mainQuery);
        break;

      case 'byForm':
        counts.byForm = await countByForm(qb, mainQuery, params);
        break;
      case 'byLeadStatus':
        {
          for (const status of COC_LEAD_STATUS_TYPES) {
            counts.byLeadStatus[status] = await count(qb.leadStatusFilter(status), mainQuery);
          }
        }
        break;

      case 'byLifecycleState':
        {
          for (const state of COC_LIFECYCLE_STATE_TYPES) {
            counts.byLifecycleState[state] = await count(qb.lifecycleStateFilter(state), mainQuery);
          }
        }
        break;

      case 'byIntegrationType':
        counts.byIntegrationType = await countByIntegration(mainQuery);
        break;
    }

    // Count customers by fake segment
    if (params.byFakeSegment) {
      counts.byFakeSegment = await count(await QueryBuilder.segments(params.byFakeSegment), mainQuery);
    }

    return counts;
  },

  /**
   * Publishes customers list for the preview
   * when creating/editing a customer segment
   */
  async customerListForSegmentPreview(_root, { segment, limit }: { segment: ISegment; limit: number }) {
    const headSegment = await Segments.findOne({ _id: segment.subOf });

    const query = await QueryBuilder.segments(segment, headSegment);
    const sort = { 'messengerData.lastSeenAt': -1 };

    return Customers.find(query)
      .sort(sort)
      .limit(limit);
  },

  /**
   * Get one customer
   */
  customerDetail(_root, { _id }: { _id: string }) {
    return Customers.findOne({ _id });
  },
};

moduleRequireLogin(customerQueries);

checkPermission(customerQueries, 'customers', 'showCustomers', []);
checkPermission(customerQueries, 'customersMain', 'showCustomers', { list: [], totalCount: 0 });

export default customerQueries;
