import { Document, Schema } from 'mongoose';
import { field } from '../utils';
import { IRule, ruleSchema } from './common';
import { MESSENGER_KINDS, METHODS, SENT_AS_CHOICES } from './constants';

export interface IScheduleDate {
  type?: string;
  month?: string | number;
  day?: string | number;
  time?: string;
}

interface IScheduleDateDocument extends IScheduleDate, Document {}

export interface IEmail {
  attachments?: any;
  subject?: string;
  content?: string;
}

export interface IEmailDocument extends IEmail, Document {}

export interface IMessenger {
  brandId?: string;
  kind?: string;
  sentAs?: string;
  content?: string;
  rules?: IRule[];
}

interface IMessengerDocument extends IMessenger, Document {}

export interface IStats {
  open: number;
  click: number;
  complaint: number;
  delivery: number;
  bounce: number;
  reject: number;
  send: number;
  renderingfailure: number;
}

interface IStatsDocument extends IStats, Document {}

export interface IEngageMessage {
  kind?: string;
  segmentIds?: string[];
  brandIds?: string[];
  tagIds?: string[];
  customerIds?: string[];
  title?: string;
  fromUserId?: string;
  method?: string;
  isDraft?: boolean;
  isLive?: boolean;
  stopDate?: Date;
  messengerReceivedCustomerIds?: string[];
  email?: IEmail;
  scheduleDate?: IScheduleDate;
  messenger?: IMessenger;
  deliveryReports?: any;
  stats?: IStats;
}

export interface IEngageMessageDocument extends IEngageMessage, Document {
  scheduleDate?: IScheduleDateDocument;

  email?: IEmailDocument;
  messenger?: IMessengerDocument;
  stats?: IStatsDocument;

  _id: string;
}

// Mongoose schemas =======================
const scheduleDateSchema = new Schema(
  {
    type: field({ type: String, optional: true }),
    month: field({ type: String, optional: true }),
    day: field({ type: String, optional: true }),
    time: field({ type: Date, optional: true }),
  },
  { _id: false },
);

const emailSchema = new Schema(
  {
    attachments: field({ type: Object }),
    subject: field({ type: String }),
    content: field({ type: String }),
  },
  { _id: false },
);

const messengerSchema = new Schema(
  {
    brandId: field({ type: String }),
    kind: field({
      type: String,
      enum: MESSENGER_KINDS.ALL,
    }),
    sentAs: field({
      type: String,
      enum: SENT_AS_CHOICES.ALL,
    }),
    content: field({ type: String }),
    rules: field({ type: [ruleSchema] }),
  },
  { _id: false },
);

const statsSchema = new Schema(
  {
    open: field({ type: Number }),
    click: field({ type: Number }),
    complaint: field({ type: Number }),
    delivery: field({ type: Number }),
    bounce: field({ type: Number }),
    reject: field({ type: Number }),
    send: field({ type: Number }),
    renderingfailure: field({ type: Number }),
  },
  { _id: false },
);

export const engageMessageSchema = new Schema({
  _id: field({ pkey: true }),
  kind: field({ type: String }),
  segmentId: field({ type: String, optional: true }), // TODO Remove
  segmentIds: field({
    type: [String],
    optional: true,
  }),
  brandIds: field({
    type: [String],
    optional: true,
  }),
  customerIds: field({ type: [String] }),
  title: field({ type: String }),
  fromUserId: field({ type: String }),
  method: field({
    type: String,
    enum: METHODS.ALL,
  }),
  isDraft: field({ type: Boolean }),
  isLive: field({ type: Boolean }),
  stopDate: field({ type: Date }),
  createdDate: field({ type: Date }),
  tagIds: field({ type: [String], optional: true }),
  messengerReceivedCustomerIds: field({ type: [String] }),

  email: field({ type: emailSchema }),
  scheduleDate: field({ type: scheduleDateSchema }),
  messenger: field({ type: messengerSchema }),
  deliveryReports: field({ type: Object }),
  stats: field({ type: statsSchema, default: {} }),
});
