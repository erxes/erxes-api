import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IDashboardItemInput {
  layout: string;
  vizState: string;
  name: string;
}
export interface IDashboardItem {
  layout: string;
  vizState: string;
  name: string;
}

export interface IDashboardItemDocument extends IDashboardItem, Document {
  _id: string;
  createdAt: Date;
}

export const dashboardItemSchema = new Schema({
  _id: field({ pkey: true }),
  layout: field({ type: String }),
  vizState: field({ type: String }),
  name: field({ type: String }),
});
