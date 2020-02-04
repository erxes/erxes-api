import * as moment from 'moment';
import * as _ from 'underscore';
import { IConformityQueryParams } from '../../../data/modules/conformities/types';
import { FormSubmissions, Integrations } from '../../../db/models';
import { CommonBuilder } from './utils';

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
  integrationType?: string;
  integration?: string;
  sortField?: string;
  sortDirection?: number;
}

export class Builder extends CommonBuilder<IListArgs> {
  constructor(params: IListArgs) {
    super('customers', params);
  }

  // filter by brand
  public async brandFilter(brandId: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ brandId });

    this.positiveList.push({
      terms: {
        'integrationId.keyword': integrations.map(i => i._id),
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
    this.positiveList.push({
      terms: {
        integrationId: integrations.map(i => i._id),
      },
    });
  }

  // filter by integration kind
  public async integrationTypeFilter(kind: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ kind });

    this.positiveList.push({
      terms: {
        integrationId: integrations.map(i => i._id),
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

    this.positiveList.push({
      terms: {
        _id: ids,
      },
    });
  }

  /*
   * prepare all queries. do not do any action
   */
  public async buildAllQueries(): Promise<void> {
    await super.buildAllQueries();

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

    // filter by form
    if (this.params.form) {
      if (this.params.startDate && this.params.endDate) {
        await this.formFilter(this.params.form, this.params.startDate, this.params.endDate);
      } else {
        await this.formFilter(this.params.form);
      }
    }
  }
}
