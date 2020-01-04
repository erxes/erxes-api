import { ProductCategories, Products } from '../../../db/models';
import {
  IProduct,
  IProductCategory,
  IProductCategoryDocument,
  IProductDocument,
} from '../../../db/models/definitions/deals';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherProductCategoryNames, gatherTagNames, LogDesc } from './logUtils';

interface IProductsEdit extends IProduct {
  _id: string;
}

interface IProductCategoriesEdit extends IProductCategory {
  _id: string;
}

const productMutations = {
  /**
   * Creates a new product
   * @param {Object} doc Product document
   */
  async productsAdd(_root, doc: IProduct, { user, docModifier }: IContext) {
    const product: IProductDocument = await Products.createProduct(docModifier(doc));

    const category: IProductCategoryDocument | null = await ProductCategories.findOne({ _id: product.categoryId });

    const extraDesc: LogDesc[] = [];

    if (category) {
      extraDesc.push({ categoryId: product.categoryId, name: category.name });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.PRODUCT,
        newData: JSON.stringify({
          ...doc,
          categoryId: product.categoryId,
          customFieldsData: product.customFieldsData,
        }),
        object: product,
        description: `"${product.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return product;
  },

  /**
   * Edits a product
   * @param {string} param2._id Product id
   * @param {Object} param2.doc Product info
   */
  async productsEdit(_root, { _id, ...doc }: IProductsEdit, { user }: IContext) {
    const product: IProductDocument = await Products.getProduct({ _id });
    const updated: IProductDocument = await Products.updateProduct(_id, doc);

    let extraDesc: LogDesc[] = [];

    if (product.tagIds) {
      extraDesc = await gatherTagNames({
        idFields: product.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    const categoryIds: string[] = [];

    if (product.categoryId) {
      categoryIds.push(product.categoryId);
    }

    if (doc.categoryId && doc.categoryId !== product.categoryId) {
      categoryIds.push(doc.categoryId);
    }

    if (categoryIds.length > 0) {
      extraDesc = await gatherProductCategoryNames({
        idFields: categoryIds,
        foreignKey: 'categoryId',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.PRODUCT,
        object: product,
        newData: JSON.stringify({ ...doc, customFieldsData: updated.customFieldsData }),
        description: `${product.name} has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Removes a product
   * @param {string} param1._id Product id
   */
  async productsRemove(_root, { productIds }: { productIds: string[] }, { user }: IContext) {
    const products: IProductDocument[] = await Products.find({ _id: { $in: productIds } }).lean();

    await Products.removeProducts(productIds);

    for (const product of products) {
      let extraDesc: LogDesc[] = [];

      if (product.tagIds) {
        extraDesc = await gatherTagNames({
          idFields: product.tagIds,
          foreignKey: 'tagIds',
        });
      }

      if (product.categoryId) {
        extraDesc = await gatherProductCategoryNames({
          idFields: [product.categoryId],
          foreignKey: 'categoryId',
          prevList: extraDesc,
        });
      }

      await putDeleteLog(
        {
          type: MODULE_NAMES.PRODUCT,
          object: product,
          description: `"${product.name}" has been removed`,
          extraDesc: JSON.stringify(extraDesc),
        },
        user,
      );
    }

    return productIds;
  },

  /**
   * Creates a new product category
   * @param {Object} doc Product category document
   */
  async productCategoriesAdd(_root, doc: IProductCategory, { user, docModifier }: IContext) {
    const productCategory = await ProductCategories.createProductCategory(docModifier(doc));

    const extraDesc: LogDesc[] = [];

    if (doc.parentId) {
      const parent: IProductCategoryDocument | null = await ProductCategories.findOne({ _id: doc.parentId });

      if (parent) {
        extraDesc.push({ parentId: parent._id, name: parent.name });
      }
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.PRODUCT_CATEGORY,
        newData: JSON.stringify({ ...doc, order: productCategory.order }),
        object: productCategory,
        description: `"${productCategory.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return productCategory;
  },

  /**
   * Edits a product category
   * @param {string} param2._id ProductCategory id
   * @param {Object} param2.doc ProductCategory info
   */
  async productCategoriesEdit(_root, { _id, ...doc }: IProductCategoriesEdit, { user }: IContext) {
    const productCategory = await ProductCategories.getProductCatogery({ _id });

    const updated = await ProductCategories.updateProductCategory(_id, doc);

    const parentIds: string[] = [];
    let extraDesc: LogDesc[] = [];

    if (productCategory.parentId) {
      parentIds.push(productCategory.parentId);
    }

    if (doc.parentId && doc.parentId !== productCategory.parentId) {
      parentIds.push(doc.parentId);
    }

    if (parentIds.length > 0) {
      extraDesc = await gatherProductCategoryNames({
        idFields: parentIds,
        foreignKey: 'parentId',
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.PRODUCT_CATEGORY,
        object: productCategory,
        newData: JSON.stringify(doc),
        description: `"${productCategory.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Removes a product category
   * @param {string} param1._id ProductCategory id
   */
  async productCategoriesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const productCategory = await ProductCategories.getProductCatogery({ _id });
    const removed = await ProductCategories.removeProductCategory(_id);

    await putDeleteLog(
      {
        type: MODULE_NAMES.PRODUCT_CATEGORY,
        object: productCategory,
        description: `"${productCategory.name}" has been removed`,
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(productMutations, 'manageProducts');

export default productMutations;
