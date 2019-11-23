import { Document, Schema } from 'mongoose';
import { field } from './utils';

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
