import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { IProduct, IProductDocument, productSchema } from './definitions/deals';

export interface IProductModel extends Model<IProductDocument> {
  createProduct(doc: IProduct): Promise<IProductDocument>;
  updateProduct(_id: string, doc: IProduct): Promise<IProductDocument>;
  removeProduct(_id: string): void;
}

export const loadClass = (models: IModels) => {
  class Product {
    /**
     * Create a product
     */
    public static async createProduct(doc: IProduct) {
      const { Products } = models;

      return Products.create(doc);
    }

    /**
     * Update Product
     */
    public static async updateProduct(_id: string, doc: IProduct) {
      const { Products } = models;

      await Products.update({ _id }, { $set: doc });

      return Products.findOne({ _id });
    }

    /**
     * Remove Product
     */
    public static async removeProduct(_id: string) {
      const { Products, Deals } = models;

      const product = await Products.findOne({ _id });

      if (!product) {
        throw new Error('Product not found');
      }

      const count = await Deals.find({
        'productsData.productId': { $in: [_id] },
      }).count();

      if (count > 0) {
        throw new Error("Can't remove a product");
      }

      return Products.remove({ _id });
    }
  }

  productSchema.loadClass(Product);

  return productSchema;
};
