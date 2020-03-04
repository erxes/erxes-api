import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface ISession {
  createdAt?: Date;
  loginToken: string;
  loginDate: Date;
  logoutDate?: Date;
  userId: string;
  expiresAt?: Date;
  ipAddress?: string;
}

export interface ISessionDocument extends Document, ISession {
  _id: string;
}

export const sessionSchema = new Schema({
  createdAt: field({ type: Date, default: new Date(), label: 'Created at' }),
  userId: field({ type: String, label: 'User' }),
  loginToken: field({ type: String, label: 'Login token' }),
  loginDate: field({ type: Date, label: 'Login date', default: new Date() }),
  logoutDate: field({ type: Date, label: 'Logout date' }),
  expiresAt: field({ type: Date, label: 'Token expire date' }),
  ipAddress: field({ type: String, label: 'Client IP address' }),
});
