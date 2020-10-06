import { Document, Schema } from 'mongoose';

import { field, schemaWrapper } from './utils';

export interface ILoyalty {
  customerId: string;
  modifiedAt: Date;
  value: number;
  dealId?: string;
  userId?: string;
}

export interface ILoyaltyDocument extends ILoyalty, Document {
  _id: string;
}

export const loyaltySchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),

    modifiedAt: field({ type: Date, label: 'Modified at' }),
    customerId: field({ type: String, label: 'Customer', index: true }),
    value: field({ type: Number, label: 'Value' }),
    dealId: field({type: String, label: 'Deal', optional: true, index: true}),
    userId: field({type: String, optional: true, label: 'User' }),
  }),
);
