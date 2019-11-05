import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IConformity {
  mainType: string;
  mainTypeId: string;
  relType: string;
  relTypeId: string;
  content: string;
  editAble: boolean;
  createdBy: string;
}

export interface IConformityAdd {
  mainType?: string;
  mainTypeId?: string;
  relType?: string;
  relTypeId?: string;
  content?: string;
  editAble?: boolean;
  createdBy?: string;
}

export interface IConformityEdit {
  mainType: string;
  mainTypeId: string;
  relType: string;
  relTypeIds: string[];
}

export interface IConformitySaved {
  mainType: string;
  mainTypeId: string;
  relType: string;
}

export interface IConformityChange {
  type: string;
  newTypeId: string;
  oldTypeIds: string[];
}

export interface IConformityFilter {
  mainType: string;
  mainTypeIds: string[];
  relType: string;
}

export interface IConformityRemove {
  mainType: string;
  mainTypeId: string;
}

export interface IConformityDocument extends IConformity, Document {
  _id: string;
}

export const conformitySchema = new Schema({
  _id: field({ pkey: true }),
  mainType: field({ type: String, index: true }),
  mainTypeId: field({ type: String }),
  relType: field({ type: String, index: true }),
  relTypeId: field({ type: String }),
  content: field({ type: String }),
  createdBy: field({ type: String }),
  editAble: field({ type: Boolean, default: true }),
  createdAt: field({
    type: Date,
    default: Date.now,
  }),
});
