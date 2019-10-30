import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IInternalNote {
  contentType: string;
  contentTypeId: string;
  content: string;
  mentionedUserIds?: string[];
}

export interface IInternalNoteDocument extends IInternalNote, Document {
  _id: string;
}

// Mongoose schemas =======================

export const internalNoteSchema = new Schema({
  _id: field({ pkey: true }),
  content: field({
    type: String,
  }),
});
