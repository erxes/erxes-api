import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { commonItemFieldsSchema, IItemCommonFields } from './boards';
import { TASK_TYPES } from './constants';

export interface ITask extends IItemCommonFields {
  contentType?: string;
  contentId?: string;
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

  contentType: field({ type: String, enum: TASK_TYPES.ALL, optional: true }),
  contentId: field({ type: String, optional: true }),
  typeId: field({ type: String, optional: true }),
  isDone: field({ type: Boolean }),
  previousStageId: field({ type: String }),
  priority: field({ type: String, optional: true }),
});
