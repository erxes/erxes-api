import { Document, Schema } from 'mongoose';
import { FORM_TYPES } from './constants';
import { field, schemaWrapper } from './utils';

export interface IForm {
  title: string;
  code?: string;
  type: string;
  description?: string;
  buttonText?: string;
}

export interface IFormDocument extends IForm, Document {
  _id: string;
  createdUserId: string;
  createdDate: Date;
}

// schema for form document
export const formSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    title: field({ type: String, optional: true }),
    type: field({ type: String, enum: FORM_TYPES.ALL, required: true }),
    description: field({
      type: String,
      optional: true,
    }),
    buttonText: field({ type: String, optional: true }),
    code: field({ type: String }),
    createdUserId: field({ type: String }),
    createdDate: field({
      type: Date,
      default: Date.now,
    }),
  }),
);
