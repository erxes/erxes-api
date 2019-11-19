import { Document, Schema } from 'mongoose';
import { field } from './utils';

// job ====================
export interface IRobotJob {
  type: string;
  createdAt: Date;
  parentId?: string;
  isNotified: boolean;
  data: any;
}

export interface IRobotJobDocument extends IRobotJob, Document {
  _id: string;
}

export const robotJobSchema = new Schema({
  _id: field({ pkey: true }),
  type: field({ type: String }),
  createdAt: field({ type: Date }),
  parentId: field({ type: String, optional: true }),
  isNotified: field({ type: Boolean, default: false }),
  data: field({ type: Object }),
});

// onboarding history ====================
export interface IOnboardingHistory {
  userId: string;
  totalPoint: number;
  isCompleted: boolean;
  completedSteps: string[];
}

export interface IOnboardingHistoryDocument extends IOnboardingHistory, Document {
  _id: string;
}

export const onboardingHistorySchema = new Schema({
  _id: field({ pkey: true }),
  userId: field({ type: String }),
  totalPoint: field({ type: Number }),
  isCompleted: field({ type: Boolean }),
  completedSteps: field({ type: [String] }),
});
