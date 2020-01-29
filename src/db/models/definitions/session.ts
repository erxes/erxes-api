import { Document, Schema } from 'mongoose';
import { USER_STATUSES } from '../../../data/constants';
import { field } from './utils';

export interface ISession {
  createdAt?: Date;
  loginToken: string;
  userId: string;
  status: string;
}

export interface ISessionDocument extends Document, ISession {
  _id: string;
}

export const sessionSchema = new Schema({
  createdAt: field({ type: Date, default: new Date(), label: 'Created at', optional: true }),
  userId: field({ type: String, label: 'User' }),
  loginToken: field({ type: String, label: 'Login token' }),
  status: field({ type: String, enum: USER_STATUSES.ALL, label: 'Status' }),
});
