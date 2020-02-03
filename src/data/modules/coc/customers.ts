import * as moment from 'moment';
import * as _ from 'underscore';
import { IConformityQueryParams } from '../../../data/modules/conformities/types';
import { FormSubmissions, Integrations, Segments } from '../../../db/models';
import { fetchElk } from '../../../elasticsearch';
import { searchBySegments } from '../segments/queryBuilder';

interface ISortParams {
  [index: string]: number;
}

export const sortBuilder = (params: IListArgs): ISortParams => {
  const sortField = params.sortField;
  const sortDirection = params.sortDirection || 0;

  let sortParams: ISortParams = { 'messengerData.lastSeenAt': -1 };

  if (sortField) {
    sortParams = { [sortField]: sortDirection };
  }

  return sortParams;
};

export interface IListArgs extends IConformityQueryParams {
  page?: number;
  perPage?: number;
  segment?: string;
  tag?: string;
  ids?: string[];
  searchValue?: string;
  brand?: string;
  form?: string;
  startDate?: string;
  endDate?: string;
  lifecycleState?: string;
  leadStatus?: string;
  type?: string;
  sortField?: string;
  sortDirection?: number;
  byFakeSegment?: any;
  integrationType?: string;
  integration?: string;
}

export class Builder {
  public params: IListArgs;
  public queries: any[];

  constructor(params: IListArgs) {
    this.params = params;
    this.queries = [];
  }

  // filter by segment
  public async segmentFilter(segmentId: string) {
    const segment = await Segments.findOne({ _id: segmentId });

    if (!segment) {
      return;
    }

    const customerIds = await searchBySegments(segment);

    this.queries.push({
      terms: {
        _id: customerIds,
      },
    });
  }

  // filter by brand
  public async brandFilter(brandId: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ brandId });

    this.queries.push({
      terms: {
        integrationId: integrations.map(i => i._id),
      },
    });
  }

  // filter by integration
  public async integrationFilter(integration: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ kind: integration });
    /**
     * Since both of brand and integration filters use a same integrationId field
     * we need to intersect two arrays of integration ids.
     */
    this.queries.push({
      terms: {
        integrationId: integrations.map(i => i._id),
      },
    });
  }

  // filter by integration kind
  public async integrationTypeFilter(kind: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ kind });

    this.queries.push({
      terms: {
        integrationId: integrations.map(i => i._id),
      },
    });
  }

  // filter by tagId
  public tagFilter(tagId: string) {
    this.queries.push({
      terms: {
        tagIds: [tagId],
      },
    });
  }

  // filter by search value
  public searchFilter(value: string): void {
    this.queries.push({
      regexp: {
        searchText: `.*+${value}.*`,
      },
    });
  }

  // filter by id
  public idsFilter(ids: string[]): void {
    this.queries.push({
      terms: {
        _id: ids,
      },
    });
  }

  // filter by leadStatus
  public leadStatusFilter(leadStatus: string): void {
    this.queries.push({
      term: {
        leadStatus,
      },
    });
  }

  // filter by lifecycleState
  public lifecycleStateFilter(lifecycleState: string): void {
    this.queries.push({
      term: {
        lifecycleState,
      },
    });
  }

  // filter by form
  public async formFilter(formId: string, startDate?: string, endDate?: string): Promise<void> {
    const submissions = await FormSubmissions.find({ formId });
    const ids: string[] = [];

    for (const submission of submissions) {
      const { customerId, submittedAt } = submission;

      if (customerId) {
        // Collecting customerIds inbetween dates only
        if (startDate && endDate && !ids.includes(customerId)) {
          if (moment(submittedAt).isBetween(startDate, endDate)) {
            ids.push(customerId);
          }

          // If date is not specified collecting all customers
        } else {
          ids.push(customerId);
        }
      }
    }

    this.queries.push({
      terms: {
        _id: ids,
      },
    });
  }

  /*
   * prepare all queries. do not do any action
   */
  public async buildAllQueries(): Promise<void> {
    this.queries = [];

    // filter by segment
    if (this.params.segment) {
      await this.segmentFilter(this.params.segment);
    }

    // filter by tag
    if (this.params.tag) {
      this.tagFilter(this.params.tag);
    }

    // filter by brand
    if (this.params.brand) {
      await this.brandFilter(this.params.brand);
    }

    // filter by integration kind
    if (this.params.integrationType) {
      await this.integrationTypeFilter(this.params.integrationType);
    }

    // filter by integration
    if (this.params.integration) {
      await this.integrationFilter(this.params.integration);
    }

    // filter by leadStatus
    if (this.params.leadStatus) {
      this.leadStatusFilter(this.params.leadStatus);
    }

    // filter by lifecycleState
    if (this.params.lifecycleState) {
      this.lifecycleStateFilter(this.params.lifecycleState);
    }

    // filter by form
    if (this.params.form) {
      if (this.params.startDate && this.params.endDate) {
        await this.formFilter(this.params.form, this.params.startDate, this.params.endDate);
      } else {
        await this.formFilter(this.params.form);
      }
    }

    // If there are ids and form params, returning ids filter only filter by ids
    if (this.params.ids) {
      this.idsFilter(this.params.ids);
    }

    // filter by search value
    if (this.params.searchValue) {
      this.searchFilter(this.params.searchValue);
    }
  }

  /*
   * Run queries
   */
  public async runQueries(action = 'search'): Promise<any> {
    const customersResponse = await fetchElk(action, 'customers', {
      size: action === 'search' ? 20 : undefined,
      query: {
        bool: {
          must: this.queries,
        },
      },
    });

    if (action === 'count') {
      return customersResponse.count;
    }

    const list = customersResponse.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source,
    }));

    return {
      list,
      totalCount: customersResponse.hits.total.value,
    };
  }
}
