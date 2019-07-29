import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';

export interface ITask extends IItemCommonFields {
  dealId?: string;
  ticketId?: string;
  typeId?: string;
  isDone?: boolean;
  previousStageId?: string;
  priority?: string;
}

export interface ITaskDocument extends ITask, Document {
  _id: string;
}

// Mongoose schemas =======================
export const taskSchema = new Schema({
  ...commonItemFieldsSchema,

  dealId: field({ type: String, optional: true }),
  ticketId: field({ type: String, optional: true }),
  typeId: field({ type: String, optional: true }),
  isDone: field({ type: Boolean }),
  previousStageId: field({ type: String }),
  priority: field({ type: String, optional: true }),
});
