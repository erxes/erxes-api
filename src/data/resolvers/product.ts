import { ProductCategories } from '../../db/models';
import { IProductDocument } from '../../db/models/definitions/deals';

export default {
  async categoryName(product: IProductDocument, {}) {
    const category = await ProductCategories.findOne({ _id: product.categoryId });

    return category ? category.name : '';
  },
};
