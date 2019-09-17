import { ProductCategories } from '../../db/models';
import { IProductCategoryDocument } from '../../db/models/definitions/deals';

export default {
  async hasChild(category: IProductCategoryDocument, {}) {
    const count = await ProductCategories.countDocuments({ parentId: category._id });

    return count > 0 ? true : false;
  },
};
