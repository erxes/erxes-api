import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IWebhookAction {
  action?: string;
  type?: string;
  label?: string;
}

const webhookActionSchema = new Schema(
  {
    action: field({ type: String }),
    type: field({ type: String }),
    label: field({ type: String }),
  },
  { _id: false },
);

export interface IWebhookActionDocument extends IWebhookAction, Document {}

export interface IWebhook {
  url: string;
  actions: IWebhookActionDocument[];
  isOutgoing: boolean;
}

export interface IWebhookDocument extends IWebhook, Document {
  _id: string;
  isOutgoing: boolean;
}

// Mongoose schemas ===========

export const webhookSchema = new Schema({
  _id: field({ pkey: true }),
  url: field({ type: String, required: true, unique: true }),
  actions: field({ type: [webhookActionSchema], label: 'actions' }),
  isOutgoing: field({ type: Boolean }),
});
