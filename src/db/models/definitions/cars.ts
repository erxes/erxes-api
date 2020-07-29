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

  manufactureBrand?: string;
  bodyType?: string;
  fuelType?: string;
  modelsName?: string;
  series?: string;
  gearBox?: string;

  vintageYear?: Date;
  importDate?: Date;
}

export interface ICarDocument extends ICar, Document {
  _id: string;
  status?: string;
  createdAt: Date;
  modifiedAt: Date;
  searchText: string;
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

    brand: field({
      type: String,
      enum: getEnum('BRANDS'),
      default: 'Toyota',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BRANDS
    }),

    bodyType: field({
      type: String,
      enum: getEnum('BODY_TYPES'),
      default: 'Sedan',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    fuelType: field({
      type: String,
      enum: getEnum('FUEL_TYPES'),
      default: 'Sedan',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    gearBox: field({
      type: String,
      enum: getEnum('FUEL_TYPES'),
      default: 'Sedan',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    modelsName: field({ type: String, label: 'Models name', optional: true }),
    series: field({ type: String, label: 'Series', optional: true }),

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
