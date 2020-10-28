import { Document, Schema } from 'mongoose';

import { customFieldSchema, ICustomField } from './common';
import { CAR_SELECT_OPTIONS } from './constants';

import { field, schemaWrapper } from './utils';

export interface ICar {
  scopeBrandIds?: string[];
  ownerId?: string;
  mergedIds?: string[];
  status?: string;
  description?: string;
  doNotDisturb?: string;
  customFieldsData?: ICustomField[];
  tagIds?: string[];

  plateNumber?: string;
  vinNumber?: string;
  colorCode?: string;

  categoryId?: string;
  bodyType?: string;
  fuelType?: string;
  gearBox?: string;

  vintageYear?: number;
  importYear?: number;
}

export interface ICarDocument extends ICar, Document {
  _id: string;
  status?: string;
  createdAt: Date;
  modifiedAt: Date;
  searchText: string;
}

export interface ICarCategory {
  code: string;
  name: string;
  order: string;
  description?: string;
  parentId?: string;
}

export interface ICarCategoryDocument extends ICarCategory, Document {
  _id: string;
  createdAt: Date;
}


const getEnum = (fieldName: string): string[] => {
  return CAR_SELECT_OPTIONS[fieldName].map(option => option.value);
};

export const carSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),

    createdAt: field({ type: Date, label: 'Created at' }),
    modifiedAt: field({ type: Date, label: 'Modified at' }),
    ownerId: field({ type: String, optional: true, label: 'Owner' }),

    plateNumber: field({ type: String, optional: true, label: 'Plate number' }),
    vinNumber: field({ type: String, label: 'VIN number', optional: true }),
    colorCode: field({ type: String, label: 'Color code' }),

    categoryId: field({ type: String, label: 'Category' }),

    bodyType: field({
      type: String,
      enum: getEnum('BODY_TYPES'),
      default: '',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    fuelType: field({
      type: String,
      enum: getEnum('FUEL_TYPES'),
      default: '',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    gearBox: field({
      type: String,
      enum: getEnum('GEARBOX'),
      default: '',
      optional: true,
      label: 'Gear box',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    vintageYear: field({ type: Number, label: 'Vintage year', default: 2020 }),
    importYear: field({ type: Number, label: 'Imported year', default: 2020 }),

    status: field({
      type: String,
      enum: getEnum('STATUSES'),
      default: 'Active',
      optional: true,
      label: 'Status',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.STATUSES,
    }),

    doNotDisturb: field({
      type: String,
      optional: true,
      default: 'No',
      enum: getEnum('DO_NOT_DISTURB'),
      label: 'Do not disturb',
      selectOptions: CAR_SELECT_OPTIONS.DO_NOT_DISTURB,
    }),

    description: field({ type: String, optional: true, label: 'Description' }),

    tagIds: field({
      type: [String],
      optional: true,
      label: 'Tags',
    }),

    // Merged car ids
    mergedIds: field({ type: [String], optional: true, label: 'Merged companies' }),

    customFieldsData: field({ type: [customFieldSchema], optional: true, label: 'Custom fields data' }),
    searchText: field({ type: String, optional: true, index: true }),
  }),
);

export const carCategorySchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, unique: true, label: 'Code' }),
    order: field({ type: String, label: 'Order' }),
    parentId: field({ type: String, optional: true, label: 'Parent' }),
    description: field({ type: String, optional: true, label: 'Description' }),
    createdAt: field({
      type: Date,
      default: new Date(),
      label: 'Created at',
    }),
  }),
);
