import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { ACTIVITY_CONTENT_TYPES } from './constants';

export interface IInternalNote {
  contentType: string;
  contentTypeId: string;
  content: string;
  mentionedUserIds?: string[];
}

export interface IInternalNoteDocument extends IInternalNote, Document {
  _id: string;
  createdUserId: string;
  createdDate: Date;
  mentionedUserIds?: string[];
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
  mentionedUserIds: field({
    type: [String],
    optional: true,
  }),
  createdUserId: field({
    type: String,
  }),
  createdDate: field({
    type: Date,
  }),
});
