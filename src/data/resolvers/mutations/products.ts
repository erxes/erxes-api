import { ProductCategories, Products } from '../../../db/models';
import { IProduct, IProductCategory, IProductDocument } from '../../../db/models/definitions/deals';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherProductCategoryNames, gatherProductFieldNames, LogDesc } from './logUtils';

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
    const product = await Products.createProduct(docModifier(doc));

    const category = await ProductCategories.findOne({ _id: product.categoryId });

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
    const product = await Products.getProduct({ _id });
    const updated = await Products.updateProduct(_id, doc);

    let extraDesc: LogDesc[] = await gatherProductFieldNames(product);

    extraDesc = await gatherProductFieldNames(updated, extraDesc);

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
      const extraDesc: LogDesc[] = await gatherProductFieldNames(product);

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
      const parent = await ProductCategories.findOne({ _id: doc.parentId });

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

    let extraDesc: LogDesc[] = [];

    if (productCategory.parentId) {
      extraDesc = await gatherProductCategoryNames({
        idFields: [productCategory.parentId],
        foreignKey: 'parentId',
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.PRODUCT_CATEGORY,
        object: productCategory,
        description: `"${productCategory.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(productMutations, 'manageProducts');

export default productMutations;
