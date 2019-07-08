import { Products } from '../../../db/models';
import { IProduct } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface IProductsEdit extends IProduct {
  _id: string;
}

const productMutations = {
  /**
   * Creates a new product
   * @param {Object} doc Product document
   */
  async productsAdd(_root, doc: IProduct, { user }: { user: IUserDocument }) {
    const product = await Products.createProduct(doc);

    if (product) {
      await putLog(
        {
          type: 'product',
          action: LOG_ACTIONS.CREATE,
          newData: JSON.stringify(doc),
          objectId: product._id,
          description: `${product.name} has been created`,
        },
        user,
      );
    }

    return product;
  },

  /**
   * Edits a product
   * @param {string} param2._id Product id
   * @param {Object} param2.doc Product info
   */
  async productsEdit(_root, { _id, ...doc }: IProductsEdit, { user }: { user: IUserDocument }) {
    const found = await Products.findOne({ _id });
    const updated = await Products.updateProduct(_id, doc);

    if (found) {
      await putLog(
        {
          type: 'product',
          action: LOG_ACTIONS.UPDATE,
          objectId: _id,
          oldData: JSON.stringify(found),
          newData: JSON.stringify(doc),
          description: `${found.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Removes a product
   * @param {string} param1._id Product id
   */
  async productsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const found = await Products.findOne({ _id });
    const removed = await Products.removeProduct(_id);

    if (found) {
      await putLog(
        {
          type: 'product',
          action: LOG_ACTIONS.DELETE,
          oldData: JSON.stringify(found),
          objectId: _id,
          description: `${found.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(productMutations, 'manageProducts');

export default productMutations;
