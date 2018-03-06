import mongoose from 'mongoose';

export const TwitterSchema = mongoose.Schema(
  {
    info: {
      type: Object,
    },
    token: {
      type: String,
    },
    tokenSecret: {
      type: String,
    },
  },
  { _id: false },
);

export const FacebookSchema = mongoose.Schema(
  {
    appId: {
      type: String,
    },
    pageIds: {
      type: [String],
    },
  },
  { _id: false },
);


export const GmailSchema = mongoose.Schema(
  {
    email: {
      type: String,
      unique: true
    },
    access_token: {
      type: String,
    },
    refresh_token: {
      type: String,
    },
    token_type: {
      type: String,
    },
    expiry_date: {
      type: String,
    }
  },
  { _id: false },
);
