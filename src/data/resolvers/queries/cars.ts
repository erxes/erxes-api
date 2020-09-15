import { CarCategories, Cars, Conformities } from '../../../db/models';
import { TAG_TYPES } from '../../../db/models/definitions/constants';
import { Builder, IListArgs } from '../../modules/coc/cars';
import { countByBrand, countByCategory, countBySegment, countByTag } from '../../modules/coc/utils';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { paginate } from '../../utils';

interface ICountArgs extends IListArgs {
  only?: string;
}

const generateFilter = async (params, commonQuerySelector) => {
  const filter: any = commonQuerySelector;

  if (params.categoryId) {
    filter.categoryId = params.categoryId;
  }

  if (params.searchValue) {
    filter.searchText = { $in: [new RegExp(`.*${params.searchValue}.*`, 'i')] }
  }

  if (params.ids) {
    filter._id = { $in: params.ids };
  }

  if (params.tag) {
    filter.tagIds = { $in: [params.tag] };
  }

  if (params.brand) {
    filter.brandIds = { $in: [params.brand] };
  }

  if (params.conformityMainTypeId && params.conformityMainType && params.conformityIsSaved) {
    filter._id = { $in: await Conformities.savedConformity({mainType: params.conformityMainType, mainTypeId: params.conformityMainTypeId, relTypes: ['car']})}
  }
  if (params.conformityMainTypeId && params.conformityMainType && params.conformityIsRelated) {
    filter._id = { $in: await Conformities.relatedConformity({mainType: params.conformityMainType, mainTypeId: params.conformityMainTypeId, relType: 'car'})}
  }

  return filter;
}

const carQueries = {


  /**
   * Cars list
   */
  async cars(_root, params: IListArgs, { commonQuerySelector }: IContext) {
    return paginate(Cars.find(await generateFilter(params, commonQuerySelector)), {
      page: params.page,
      perPage: params.perPage
    });
  },

  /**
   * Cars for only main list
   */
  async carsMain(_root, params: IListArgs, { commonQuerySelector }: IContext) {
    const filter = generateFilter(params, commonQuerySelector);

    return {
      list: paginate(Cars.find(filter), {
        page: params.page,
        perPage: params.perPage
      }),
      totalCount: Cars.find(filter).count()};
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
      byCategory: {},
    };

    const { only } = args;

    const qb = new Builder(args, { commonQuerySelector, commonQuerySelectorElk });

    switch (only) {
      case 'byTag':
        counts.byTag = await countByTag(TAG_TYPES.CAR, qb);
        break;

      case 'bySegment':
        counts.bySegment = await countBySegment('car', qb);
        break;
      case 'byBrand':
        counts.byBrand = await countByBrand(qb);
        break;

      case 'byCategory':
        counts.byCategory = await countByCategory(qb);
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

  carCategories(
    _root,
    { parentId, searchValue }: { parentId: string; searchValue: string },
    { commonQuerySelector }: IContext,
  ) {
    const filter: any = commonQuerySelector;

    if (parentId) {
      filter.parentId = parentId;
    }

    if (searchValue) {
      filter.name = new RegExp(`.*${searchValue}.*`, 'i');
    }

    return CarCategories.find(filter).sort({ order: 1 });
  },

  carCategoriesTotalCount(_root) {
    return CarCategories.find().countDocuments();
  },

  carCategoryDetail(_root, { _id }: { _id: string }) {
    return CarCategories.findOne({ _id });
  },
};

requireLogin(carQueries, 'carsMain');
requireLogin(carQueries, 'carCounts');
requireLogin(carQueries, 'carDetail');

checkPermission(carQueries, 'cars', 'showCars', []);
checkPermission(carQueries, 'carsMain', 'showCars', { list: [], totalCount: 0 });

export default carQueries;
