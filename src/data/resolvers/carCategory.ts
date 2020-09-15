import { Cars } from '../../db/models';
import { ICarCategoryDocument } from '../../db/models/definitions/cars';

export default {
  isRoot(category: ICarCategoryDocument, {}) {
    return category.parentId ? false : true;
  },

  async carCount(category: ICarCategoryDocument, {}) {
    return Cars.countDocuments({ categoryId: category._id });
  },
};
