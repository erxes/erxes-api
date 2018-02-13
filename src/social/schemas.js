import mongoose from 'mongoose';

export const TwitterSchema = mongoose.Schema(
  {
    id: {
      type: Number,
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
      type: String
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
