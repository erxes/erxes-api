import { IContext } from '../../../connectionResolver';
import { moduleRequireLogin } from '../../permissions';
import { paginate } from './utils';

const brandQueries = {
  /**
   * Brands list
   */
  brands(_root, args: { page: number; perPage: number }, { models: { Brands } }: IContext) {
    const brands = paginate(Brands.find({}), args);
    return brands.sort({ createdAt: -1 });
  },

  /**
   * Get one brand
   */
  brandDetail(_root, { _id }: { _id: string }, { models: { Brands } }: IContext) {
    return Brands.findOne({ _id });
  },

  /**
   * Get all brands count. We will use it in pager
   */
  brandsTotalCount(_root, _args, { models: { Brands } }: IContext) {
    return Brands.find({}).count();
  },

  /**
   * Get last brand
   */
  brandsGetLast(_root, _args, { models: { Brands } }: IContext) {
    return Brands.findOne({}).sort({ createdAt: -1 });
  },
};

moduleRequireLogin(brandQueries);

export default brandQueries;
