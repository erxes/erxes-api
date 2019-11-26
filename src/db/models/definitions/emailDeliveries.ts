import { Document, Schema } from 'mongoose';
import { field } from './utils';

interface IAttachmentParams {
  data: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface IEmailDeliveries {
  title?: string;
  subject: string;
  content: string;
  attachments?: IAttachmentParams[];
  customerId: string;
  fromUserId: string;
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
  title: field({ type: String }),
  subject: field({ type: String, optional: true }),
  content: field({ type: String }),
  customerId: field({ type: String }),
  fromUserId: field({ type: String, optional: true }),
  attachments: field({ type: [attachmentSchema] }),

  createdAt: field({ type: Date, default: Date.now }),
});
