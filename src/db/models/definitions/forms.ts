import { Document, Schema } from 'mongoose';
import { IRule, ruleSchema } from './common';
import { FORM_TYPES } from './constants';
import { calloutSchema, ICallout, ISubmission, submissionSchema } from './integrations';
import { field, schemaWrapper } from './utils';

export interface IForm {
  title: string;
  code?: string;
  type: string;
  description?: string;
  buttonText?: string;
}

export interface IFormDocument extends IForm, Document {
  _id: string;
  viewCount?: number;
  contactsGathered?: number;

  submissions?: ISubmission[];
  themeColor?: string;
  callout?: ICallout;
  rules?: IRule;
  createdUserId: string;
  createdDate: Date;
}

// schema for form document
export const formSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    title: field({ type: String, optional: true }),
    type: field({ type: String, enum: FORM_TYPES.ALL, required: true }),
    description: field({
      type: String,
      optional: true,
    }),
    buttonText: field({ type: String, optional: true }),
    code: field({ type: String }),
    createdUserId: field({ type: String }),
    createdDate: field({
      type: Date,
      default: Date.now,
    }),

    themeColor: field({
      type: String,
      optional: true,
    }),
    callout: field({
      type: calloutSchema,
      optional: true,
    }),
    viewCount: field({
      type: Number,
      optional: true,
    }),
    contactsGathered: field({
      type: Number,
      optional: true,
    }),
    submissions: field({
      type: [submissionSchema],
      optional: true,
    }),
    rules: field({
      type: [ruleSchema],
      optional: true,
    }),
  }),
);
