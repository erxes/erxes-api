import * as _ from 'underscore';
import { IConformityQueryParams } from '../../../data/modules/conformities/types';
import { Conformities, Customers, Integrations } from '../../../db/models';
import { CommonBuilder } from './utils';

type TSortBuilder = { primaryName: number } | { [index: string]: number };

export const sortBuilder = (params: IListArgs): TSortBuilder => {
  const sortField = params.sortField;
  const sortDirection = params.sortDirection || 0;

  let sortParams: TSortBuilder = { primaryName: -1 };

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
  lifecycleState?: string;
  leadStatus?: string;
  brand?: string;
  sortField?: string;
  sortDirection?: number;
}

export class Builder extends CommonBuilder<IListArgs> {
  constructor(params: IListArgs) {
    super('companies', params);
  }

  // filter by brand
  public async brandFilter(brandId: string): Promise<void> {
    const integrations = await Integrations.findIntegrations({ brandId }, { _id: 1 });
    const integrationIds = integrations.map(i => i._id);

    const customers = await Customers.find({ integrationId: { $in: integrationIds } }, { companyIds: 1 });

    const customerIds = await customers.map(customer => customer._id);
    const companyIds = await Conformities.filterConformity({
      mainType: 'customer',
      mainTypeIds: customerIds,
      relType: 'company',
    });

    this.positiveList.push({
      terms: {
        _id: companyIds || [],
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
  }
}
