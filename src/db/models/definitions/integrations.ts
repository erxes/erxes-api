import { Document, Schema } from 'mongoose';
import { KIND_CHOICES, LEAD_LOAD_TYPES, LEAD_SUCCESS_ACTIONS, MESSENGER_DATA_AVAILABILITY } from './constants';
import { field } from './utils';

export interface ILink {
  twitter?: string;
  facebook?: string;
  youtube?: string;
}

export interface IMessengerOnlineHours {
  day?: string;
  from?: string;
  to?: string;
}

export interface IMessengerOnlineHoursDocument extends IMessengerOnlineHours, Document {}

export interface IMessengerDataMessagesItem {
  greetings?: { title?: string; message?: string };
  away?: string;
  thank?: string;
  welcome?: string;
}

export interface IMessageDataMessages {
  [key: string]: IMessengerDataMessagesItem;
}

export interface IMessengerData {
  supporterIds?: string[];
  notifyCustomer?: boolean;
  availabilityMethod?: string;
  isOnline?: boolean;
  onlineHours?: IMessengerOnlineHours[];
  timezone?: string;
  messages?: IMessageDataMessages;
  links?: ILink;
  showChat?: boolean;
  showLauncher?: boolean;
  requireAuth?: boolean;
  forceLogoutWhenResolve?: boolean;
}

export interface IMessengerDataDocument extends IMessengerData, Document {}

export interface ILeadData {
  loadType?: string;
  successAction?: string;
  fromEmail?: string;
  userEmailTitle?: string;
  userEmailContent?: string;
  adminEmails?: string;
  adminEmailTitle?: string;
  adminEmailContent?: string;
  thankContent?: string;
  redirectUrl?: string;
}

export interface ILeadDataDocument extends ILeadData, Document {}

export interface IUiOptions {
  color?: string;
  wallpaper?: string;
  logo?: string;
}

// subdocument schema for messenger UiOptions
export interface IUiOptionsDocument extends IUiOptions, Document {}

export interface IIntegration {
  kind?: string;
  name?: string;
  brandId?: string;
  languageCode?: string;
  tagIds?: string[];
  leadId?: string;
  leadData?: ILeadData;
  messengerData?: IMessengerData;
  uiOptions?: IUiOptions;
}

export interface IIntegrationDocument extends IIntegration, Document {
  _id: string;
  leadData?: ILeadDataDocument;
  formData?: ILeadDataDocument;
  messengerData?: IMessengerDataDocument;
  uiOptions?: IUiOptionsDocument;
}

// subdocument schema for MessengerOnlineHours
const messengerOnlineHoursSchema = new Schema(
  {
    day: field({ type: String }),
    from: field({ type: String }),
    to: field({ type: String }),
  },
  { _id: false },
);

// subdocument schema for MessengerData
const messengerDataSchema = new Schema(
  {
    supporterIds: field({ type: [String] }),
    notifyCustomer: field({ type: Boolean }),
    availabilityMethod: field({
      type: String,
      enum: MESSENGER_DATA_AVAILABILITY.ALL,
    }),
    isOnline: field({
      type: Boolean,
    }),
    onlineHours: field({ type: [messengerOnlineHoursSchema] }),
    timezone: field({
      type: String,
      optional: true,
    }),
    messages: field({ type: Object, optional: true }),
    links: {
      facebook: String,
      twitter: String,
      youtube: String,
    },
    requireAuth: field({ type: Boolean, default: true }),
    showChat: field({ type: Boolean, default: true }),
    showLauncher: field({ type: Boolean, default: true }),
    forceLogoutWhenResolve: field({ type: Boolean, default: false }),
  },
  { _id: false },
);

// subdocument schema for LeadData
const leadDataSchema = new Schema(
  {
    loadType: field({
      type: String,
      enum: LEAD_LOAD_TYPES.ALL,
    }),
    successAction: field({
      type: String,
      enum: LEAD_SUCCESS_ACTIONS.ALL,
      optional: true,
    }),
    fromEmail: field({
      type: String,
      optional: true,
    }),
    userEmailTitle: field({
      type: String,
      optional: true,
    }),
    userEmailContent: field({
      type: String,
      optional: true,
    }),
    adminEmails: field({
      type: [String],
      optional: true,
    }),
    adminEmailTitle: field({
      type: String,
      optional: true,
    }),
    adminEmailContent: field({
      type: String,
      optional: true,
    }),
    thankContent: field({
      type: String,
      optional: true,
    }),
    redirectUrl: field({
      type: String,
      optional: true,
    }),
  },
  { _id: false },
);

// subdocument schema for messenger UiOptions
const uiOptionsSchema = new Schema(
  {
    color: field({ type: String }),
    wallpaper: field({ type: String }),
    logo: field({ type: String }),
  },
  { _id: false },
);

// schema for integration document
export const integrationSchema = new Schema({
  _id: field({ pkey: true }),

  kind: field({
    type: String,
    enum: KIND_CHOICES.ALL,
  }),

  name: field({ type: String }),
  brandId: field({ type: String }),

  languageCode: field({
    type: String,
    optional: true,
  }),
  tagIds: field({ type: [String], optional: true }),
  leadId: field({ type: String }),
  leadData: field({ type: leadDataSchema }),
  messengerData: field({ type: messengerDataSchema }),
  uiOptions: field({ type: uiOptionsSchema }),
});
