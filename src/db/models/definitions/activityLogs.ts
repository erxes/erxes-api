import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IActivityLogInput {
  action: string;
  type: string;
  typeId: string;
  content?: any;
  createdBy: string;
}
export interface IActivityLog {
  type: string;
  typeId: string;
  action: string;
  content?: any;
  createdBy: string;
}
export interface IActivityLogDocument extends IActivityLog, Document {
  _id: string;
  createdAt: Date;
}

export const activityLogSchema = new Schema({
  _id: field({ pkey: true }),
  type: field({ type: String }),
  typeId: field({ type: String }),
  action: field({ type: String }),
  content: field({ type: Object }),
  // TODO: remove
  createdBy: field({ type: String }),
  createdAt: field({
    type: Date,
    required: true,
    default: Date.now,
  }),
});
