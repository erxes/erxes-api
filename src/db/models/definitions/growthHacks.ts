import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';

export interface IGrowthHack extends IItemCommonFields {
  hackDescription?: string;
  goal?: string;
  formFields?: JSON;
}

export interface IGrowthHackDocument extends IGrowthHack, Document {
  _id: string;
}

export const growthHackSchema = new Schema({
  ...commonItemFieldsSchema,

  hackDescription: field({ type: String }),
  goal: field({ type: String }),
  formFields: field({ type: Object }),
});
