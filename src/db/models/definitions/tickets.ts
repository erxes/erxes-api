import { Document, Schema } from 'mongoose';
import { field } from '../utils';

interface ICommonFields {
  userId?: string;
  createdAt?: Date;
  order?: number;
}

export interface ITicket extends ICommonFields {
  name?: string;
  closeDate?: Date;
  description?: string;
  assignedUserIds?: string[];
  stageId?: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

export interface ITicketDocument extends ITicket, ICommonFields, Document {
  _id: string;
}

// Mongoose schemas =======================
const commonFieldsSchema = {
  userId: field({ type: String }),
  createdAt: field({
    type: Date,
    default: new Date(),
  }),
  order: field({ type: Number }),
};

export const ticketSchema = new Schema({
  _id: field({ pkey: true }),
  name: field({ type: String }),
  closeDate: field({ type: Date }),
  description: field({ type: String, optional: true }),
  assignedUserIds: field({ type: [String] }),
  stageId: field({ type: String, optional: true }),
  modifiedAt: field({
    type: Date,
    default: new Date(),
  }),
  modifiedBy: field({ type: String }),
  ...commonFieldsSchema,
});
