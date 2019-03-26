import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { EMAIL_TYPES } from './constants';

interface IAttachmentParams {
  data: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface IEmailDeliveries {
  cocType: string;
  cocId: string;
  subject: string;
  body: string;
  toEmails: string;
  cc?: string;
  bcc?: string;
  attachments?: IAttachmentParams[];
  fromEmail?: string;
  type?: string;
  userId: string;
}

export interface IEmailDeliveriesDocument extends IEmailDeliveries, Document {
  id: string;
}

// Mongoose schemas ===========

const attachmentSchema = new Schema(
  {
    data: field({ type: String }),
    filename: field({ type: String }),
    size: field({ type: Number }),
    mimeType: field({ type: String }),
  },
  { _id: false },
);

export const emailDeliverySchema = new Schema({
  _id: field({ pkey: true }),
  cocType: field({ type: String, required: true }),
  cocId: field({ type: String, required: true }),
  subject: field({ type: String, optional: true }),
  body: field({ type: String, required: true }),
  toEmails: field({ type: String, required: true }),
  cc: field({ type: String, optional: true }),
  bcc: field({ type: String, optional: true }),
  attachments: field({ type: [attachmentSchema] }),
  fromEmail: field({ type: String, required: true }),
  userId: field({ type: String, required: true }),

  type: { type: String, enum: EMAIL_TYPES.ALL, default: EMAIL_TYPES.GMAIL, required: true },

  createdAt: field({
    type: Date,
    required: true,
    default: Date.now,
  }),
});
