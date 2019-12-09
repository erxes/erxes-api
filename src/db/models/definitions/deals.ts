import { Document, Schema } from 'mongoose';
import { commonItemFieldsSchema, IItemCommonFields, IProductData, productDataSchema } from './boards';
import { PRODUCT_TYPES } from './constants';
import { field, schemaWrapper } from './utils';

export interface IProduct {
  name: string;
  categoryId?: string;
  categoryCode?: string;
  type?: string;
  description?: string;
  sku?: string;
  unitPrice?: number;
  code: string;
  customFieldsData?: any;
  productId?: string;
  tagIds?: string[];
}

export interface IProductDocument extends IProduct, Document {
  _id: string;
  createdAt: Date;
}

export interface IProductCategory {
  name: string;
  code: string;
  order: string;
  description?: string;
  parentId?: string;
}

export interface IProductCategoryDocument extends IProductCategory, Document {
  _id: string;
  createdAt: Date;
}

export interface IDeal extends IItemCommonFields {
  productsData?: IProductData[];
}

export interface IDealDocument extends IDeal, Document {
  _id: string;
}

// Mongoose schemas =======================

export const productSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, unique: true, label: 'Code' }),
    categoryId: field({ type: String, label: 'Category' }),
    type: field({
      type: String,
      enum: PRODUCT_TYPES.ALL,
      default: PRODUCT_TYPES.PRODUCT,
      label: 'Type',
    }),
    tagIds: field({ type: [String], optional: true, label: 'Tags' }),
    description: field({ type: String, optional: true, label: 'Description' }),
    sku: field({ type: String, optional: true, label: 'Stock keeping unit' }),
    unitPrice: field({ type: Number, optional: true, label: 'Unit price' }),
    customFieldsData: field({
      type: Object,
      label: 'Custom fields data',
    }),
    createdAt: field({
      type: Date,
      default: new Date(),
      label: 'Created at',
    }),
  }),
);

export const productCategorySchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, unique: true, label: 'Code' }),
    order: field({ type: String, label: 'Order' }),
    parentId: field({ type: String, optional: true, label: 'Parent category' }),
    description: field({ type: String, optional: true, label: 'Description' }),
    createdAt: field({
      type: Date,
      default: new Date(),
      label: 'Created at',
    }),
  }),
);

export const dealSchema = new Schema({
  ...commonItemFieldsSchema,

  productsData: field({ type: [productDataSchema], label: 'Products' }),
});
