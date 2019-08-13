import { Document, Schema } from 'mongoose';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';
import { field } from './utils';

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
  hackStage: field({ type: String }),
  priority: field({ type: String }),
  reach: field({ type: Number }),
  impact: field({ type: Number }),
  confidence: field({ type: Number }),
  ease: field({ type: Number }),
});
