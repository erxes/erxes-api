import { Cars } from '../../../db/models';
import { TAG_TYPES } from '../../../db/models/definitions/constants';
import { Builder, IListArgs } from '../../modules/coc/cars';
import { countByBrand, countBySegment, countByTag } from '../../modules/coc/utils';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ICountArgs extends IListArgs {
  only?: string;
}

const carQueries = {
  /**
   * Cars list
   */
  async cars(_root, params: IListArgs, { commonQuerySelector, commonQuerySelectorElk }: IContext) {
    const qb = new Builder(params, { commonQuerySelector, commonQuerySelectorElk });

    await qb.buildAllQueries();

    const { list } = await qb.runQueries();

    return list;
  },

  /**
   * Cars for only main list
   */
  async carsMain(_root, params: IListArgs, { commonQuerySelector, commonQuerySelectorElk }: IContext) {
    const qb = new Builder(params, { commonQuerySelector, commonQuerySelectorElk });

    await qb.buildAllQueries();

    const { list, totalCount } = await qb.runQueries();

    return { list, totalCount };
  },

  /**
   * Group car counts by segments
   */
  async carCounts(_root, args: ICountArgs, { commonQuerySelector, commonQuerySelectorElk }: IContext) {
    const counts = {
      bySegment: {},
      byTag: {},
      byBrand: {},
      byLeadStatus: {},
    };

    const { only } = args;

    const qb = new Builder(args, { commonQuerySelector, commonQuerySelectorElk });

    switch (only) {
      case 'byTag':
        counts.byTag = await countByTag(TAG_TYPES.COMPANY, qb);
        break;

      case 'bySegment':
        counts.bySegment = await countBySegment('car', qb);
        break;
      case 'byBrand':
        counts.byBrand = await countByBrand(qb);
        break;
    }

    return counts;
  },

  /**
   * Get one car
   */
  carDetail(_root, { _id }: { _id: string }) {
    return Cars.findOne({ _id });
  },
};

requireLogin(carQueries, 'carsMain');
requireLogin(carQueries, 'carCounts');
requireLogin(carQueries, 'carDetail');

checkPermission(carQueries, 'cars', 'showCars', []);
checkPermission(carQueries, 'carsMain', 'showCars', { list: [], totalCount: 0 });

export default carQueries;
