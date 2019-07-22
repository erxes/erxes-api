import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';

export interface ITask extends IItemCommonFields {
  dealId?: string;
  tickedId?: string;
  typeId?: string;
  priority?: string;
}

export interface ITaskDocument extends ITask, Document {
  _id: string;
}

// Mongoose schemas =======================
export const taskSchema = new Schema({
  ...commonItemFieldsSchema,

  dealId: field({ type: String, optional: true }),
  tickedId: field({ type: String, optional: true }),
  typeId: field({ type: String, optional: true }),
  priority: field({ type: String, optional: true }),
});
