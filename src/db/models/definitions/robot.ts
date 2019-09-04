import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IRobotEntry {
  action: string;
  data: object;
}

export interface IRobotEntryDocument extends IRobotEntry, Document {
  _id: string;
}

// Mongoose schemas ===========

export const robotEntrySchema = new Schema({
  _id: field({ pkey: true }),
  action: field({ type: String }),
  data: field({ type: Object }),
});
