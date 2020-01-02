import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IRule extends Document {
  _id: string;
  kind: string;
  text: string;
  condition: string;
  value: string;
}

export interface ILink {
  linkedIn?: string;
  twitter?: string;
  facebook?: string;
  github?: string;
  youtube?: string;
  website?: string;
}

// schema for form's rules
const ruleSchema = new Schema(
  {
    _id: field({ type: String }),

    // browserLanguage, currentUrl, etc ...
    kind: field({ type: String, label: 'Kind' }),

    // Browser language, Current url etc ...
    text: field({ type: String, label: 'Text' }),

    // is, isNot, startsWith
    condition: field({ type: String, label: 'Condition' }),

    value: field({ type: String, label: 'Value' }),
  },
  { _id: false },
);

export { ruleSchema };
