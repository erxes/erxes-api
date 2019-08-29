import { Document, Schema } from 'mongoose';
import { IRule, ruleSchema } from './common';
import { field, schemaWrapper } from './utils';

export interface ICallout extends Document {
  title?: string;
  body?: string;
  buttonText?: string;
  featuredImage?: string;
  skip?: boolean;
}

interface ISubmission extends Document {
  customerId: string;
  submittedAt: Date;
}

export interface ILead {
  formId: string;
  themeColor?: string;
  callout?: ICallout;
  rules?: IRule;
}

export interface ILeadDocument extends ILead, Document {
  _id: string;
  createdUserId: string;
  createdDate: Date;
  viewCount: number;
  contactsGathered: number;
  submissions: ISubmission[];
}

// schema for lead's callout component
const calloutSchema = new Schema(
  {
    title: field({ type: String, optional: true }),
    body: field({ type: String, optional: true }),
    buttonText: field({ type: String, optional: true }),
    featuredImage: field({ type: String, optional: true }),
    skip: field({ type: Boolean, optional: true }),
  },
  { _id: false },
);

// schema for lead submission details
const submissionSchema = new Schema(
  {
    customerId: field({ type: String }),
    submittedAt: field({ type: Date }),
  },
  { _id: false },
);

// schema for lead document
export const leadSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    themeColor: field({ type: String, optional: true }),
    createdUserId: field({ type: String }),
    createdDate: field({
      type: Date,
      default: Date.now,
    }),
    callout: field({ type: calloutSchema, default: {} }),
    viewCount: field({ type: Number }),
    contactsGathered: field({ type: Number }),
    submissions: field({ type: [submissionSchema] }),
    rules: field({ type: [ruleSchema] }),
    formId: field({ type: String }),
  }),
);
