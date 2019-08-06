import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';

interface IFormField extends Document {
  _id: string;
  value: string;
}

export interface IGrowthHack extends IItemCommonFields {
  hackDescription?: string;
  goal?: string;
  formFields: IFormField[];
}

export interface IGrowthHackDocument extends IGrowthHack, Document {
  _id: string;
}

export const formFieldSchema = new Schema(
  {
    _id: field({ type: String }),
    value: field({ type: String }),
  },
  { _id: false },
);

export const growthHackSchema = new Schema({
  ...commonItemFieldsSchema,

  hackDescription: field({ type: String }),
  goal: field({ type: String }),
  formFields: field({ type: [formFieldSchema] }),
});
