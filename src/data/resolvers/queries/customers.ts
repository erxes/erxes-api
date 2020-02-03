import { Brands, Customers, Forms, Segments, Tags } from '../../../db/models';
import { ACTIVITY_CONTENT_TYPES, KIND_CHOICES, TAG_TYPES } from '../../../db/models/definitions/constants';
import { COC_LEAD_STATUS_TYPES, COC_LIFECYCLE_STATE_TYPES } from '../../constants';
import { Builder as BuildQuery, IListArgs } from '../../modules/coc/customers';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';
import { paginate } from '../../utils';

interface ICountBy {
  [index: string]: number;
}

interface ICountParams extends IListArgs {
  only: string;
}

const countBySegment = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by segments
  const segments = await Segments.find({
    contentType: ACTIVITY_CONTENT_TYPES.CUSTOMER,
  });

  // Count customers by segment
  for (const s of segments) {
    await qb.buildAllQueries();
    await qb.segmentFilter(s._id);

    counts[s._id] = await qb.runQueries('count');
  }

  return counts;
};

const countByBrand = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by brand
  const brands = await Brands.find({});

  for (const brand of brands) {
    await qb.buildAllQueries();
    await qb.brandFilter(brand._id);

    counts[brand._id] = await qb.runQueries('count');
  }

  return counts;
};

const countByTag = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by tag
  const tags = await Tags.find({ type: TAG_TYPES.CUSTOMER }).select('_id');
  const tagRawIds: string[] = [];

  tags.forEach(element => {
    tagRawIds.push(element._id);
  });

  for (const tag of tags) {
    await qb.buildAllQueries();
    await qb.tagFilter(tag._id);

    counts[tag._id] = await qb.runQueries('count');
  }

  return counts;
};

const countByLeadStatus = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  for (const type of COC_LEAD_STATUS_TYPES) {
    await qb.buildAllQueries();
    qb.leadStatusFilter(type);

    counts[type] = await qb.runQueries('count');
  }

  return counts;
};

const countByLifecycleStatus = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  for (const type of COC_LIFECYCLE_STATE_TYPES) {
    await qb.buildAllQueries();
    qb.lifecycleStateFilter(type);

    counts[type] = await qb.runQueries('count');
  }

  return counts;
};

const countByIntegrationType = async (qb): Promise<ICountBy> => {
  const counts: ICountBy = {};

  for (const type of KIND_CHOICES.ALL) {
    await qb.buildAllQueries();
    await qb.integrationTypeFilter(type);

    counts[type] = await qb.runQueries('count');
  }

  return counts;
};

const countByForm = async (qb: any, params: any): Promise<ICountBy> => {
  const counts: ICountBy = {};

  // Count customers by submitted form
  const forms = await Forms.find({});

  for (const form of forms) {
    await qb.buildAllQueries();
    await qb.formFilter(form._id, params);

    counts[form._id] = await qb.runQueries('count');
  }

  return counts;
};

const customerQueries = {
  /**
   * Customers list
   */
  async customers(_root, params: IListArgs) {
    return paginate(Customers.find({}), params);
  },

  /**
   * Customers for only main list
   */
  async customersMain(_root, params: IListArgs) {
    const qb = new BuildQuery(params);

    await qb.buildAllQueries();

    const { list, totalCount } = await qb.runQueries();

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
      byForm: {},
      byLeadStatus: {},
      byLifecycleState: {},
    };

    const qb = new BuildQuery(params);

    // let mainQuery = { ...commonQuerySelector, ...qb.mainQuery() };

    // // if passed at least one filter other than perPage
    // // then find all filtered customers then add subsequent filter to it
    // if (Object.keys(params).length > 1) {
    //   const customers = await Customers.find(mainQuery, { _id: 1 });
    //   const customerIds = customers.map(customer => customer._id);

    //   mainQuery = { _id: { $in: customerIds } };
    // }

    switch (only) {
      case 'bySegment':
        counts.bySegment = await countBySegment(qb);
        break;

      case 'byBrand':
        counts.byBrand = await countByBrand(qb);
        break;

      case 'byTag':
        counts.byTag = await countByTag(qb);
        break;

      case 'byForm':
        counts.byForm = await countByForm(qb, params);
        break;

      case 'byLeadStatus':
        counts.byLeadStatus = await countByLeadStatus(qb);
        break;

      case 'byLifecycleState':
        counts.byLifecycleState = await countByLifecycleStatus(qb);
        break;

      case 'byIntegrationType':
        counts.byIntegrationType = await countByIntegrationType(qb);
        break;
    }

    return counts;
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
