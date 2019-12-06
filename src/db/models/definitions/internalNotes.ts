import { Document, Schema } from 'mongoose';
import { ACTIVITY_CONTENT_TYPES } from './constants';
import { field } from './utils';

export interface IInternalNote {
  contentType: string;
  contentTypeId: string;
  content: string;
  mentionedUserIds?: string[];
}

export interface IInternalNoteDocument extends IInternalNote, Document {
  _id: string;
  createdUserId: string;
  createdAt: Date;
}

// Mongoose schemas =======================

export const internalNoteSchema = new Schema({
  _id: field({ pkey: true }),
  contentType: field({
    type: String,
    enum: ACTIVITY_CONTENT_TYPES.ALL,
  }),
  contentTypeId: field({ type: String }),
  content: field({
    type: String,
  }),
  createdUserId: field({
    type: String,
  }),
  createdAt: field({
    type: Date,
  }),
});
