import { Document, Schema } from 'mongoose';
import { ACTIVITY_CONTENT_TYPES } from './constants';
import { field, schemaWrapper } from './utils';

export interface ICondition {
  field: string;
  operator: string;
  type: string;
  value?: string;
  brandId?: string;
  dateUnit?: string;
}

export interface IConditionDocument extends ICondition, Document {}

export interface ISegment {
  contentType: string;
  name: string;
  description?: string;
  subOf: string;
  color: string;
  connector: string;
  conditions: ICondition[];
}

export interface ISegmentDocument extends ISegment, Document {
  _id: string;
}

// Mongoose schemas =======================

const conditionSchema = new Schema(
  {
    field: field({ type: String }),
    operator: field({ type: String }),
    type: field({ type: String }),

    value: field({
      type: String,
      optional: true,
    }),

    dateUnit: field({
      type: String,
      optional: true,
    }),

    brandId: field({
      type: String,
      optional: true,
    }),
  },
  { _id: false },
);

export const segmentSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    contentType: field({
      type: String,
      enum: ACTIVITY_CONTENT_TYPES.ALL,
    }),
    name: field({ type: String }),
    description: field({ type: String, optional: true }),
    subOf: field({ type: String, optional: true }),
    color: field({ type: String }),
    connector: field({ type: String }),
    conditions: field({ type: [conditionSchema] }),
  }),
);
