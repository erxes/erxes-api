import { Document, Schema } from 'mongoose';
import { field } from '../utils';

export interface ITaskType {
  name: string;
  icon: string;
}

export interface ITaskTypeDocument extends ITaskType, Document {
  _id: string;
}

// Mongoose schemas =======================
export const taskTypeSchema = new Schema({
  _id: field({ pkey: true }),
  name: field({ type: String }),
  icon: field({ type: String }),
});
