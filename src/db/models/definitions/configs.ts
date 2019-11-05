import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IConfig {
  code: string;
  value: string[];
}

export interface IConfigDocument extends IConfig, Document {
  _id: string;
}

// Mongoose schemas ===========

export const configSchema = new Schema({
  code: field({ type: String }),
  value: field({ type: [String] }),
});
