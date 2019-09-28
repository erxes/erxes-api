import { Model, model } from 'mongoose';
import {
  IOnboardingHistoryDocument,
  IRobotEntryDocument,
  onboardingHistorySchema,
  robotEntrySchema,
} from './definitions/robot';
import { IUserDocument } from './definitions/users';

// entries ==========================
export interface IRobotEntryModel extends Model<IRobotEntryDocument> {}

export const loadClass = () => {
  class RobotEntry {}

  robotEntrySchema.loadClass(RobotEntry);

  return robotEntrySchema;
};

// onboarding ==========================
interface IGetOrCreateDoc {
  type: string;
  user: IUserDocument;
}

interface IGetOrCreateResponse {
  status: string;
  entry: IOnboardingHistoryDocument;
}

interface IStepsCompletenessResponse {
  [key: string]: boolean;
}

export interface IOnboardingHistoryModel extends Model<IOnboardingHistoryDocument> {
  getOrCreate(doc: IGetOrCreateDoc): Promise<IGetOrCreateResponse>;
  stepsCompletness(steps: string[], user: IUserDocument): IStepsCompletenessResponse;
  forceComplete(userId: string): void;
  userStatus(userId: string): string;
}

export const loadOnboardingHistoryClass = () => {
  class OnboardingHistory {
    public static async getOrCreate({ type, user }: IGetOrCreateDoc): Promise<IGetOrCreateResponse> {
      const step = `${type}Create`;

      const prevEntry = await OnboardingHistories.findOne({ userId: user._id });

      if (!prevEntry) {
        const entry = await OnboardingHistories.create({ userId: user._id, completedSteps: [step] });
        return { status: 'created', entry };
      }

      if (prevEntry.isCompleted) {
        return { status: 'completed', entry: prevEntry };
      }

      if (prevEntry.completedSteps.includes(step)) {
        return { status: 'prev', entry: prevEntry };
      }

      const updatedEntry = await OnboardingHistories.updateOne(
        { userId: user._id },
        { $push: { completedSteps: step } },
      );

      return { status: 'created', entry: updatedEntry };
    }

    public static async stepsCompletness(steps: string[], user: IUserDocument): Promise<IStepsCompletenessResponse> {
      const result: IStepsCompletenessResponse = {};

      for (const step of steps) {
        const selector = { userId: user._id, completedSteps: { $in: [step] } };
        result[step] = (await OnboardingHistories.find(selector).countDocuments()) > 0;
      }

      return result;
    }

    public static async forceComplete(userId: string): Promise<void> {
      return OnboardingHistories.updateOne({ userId }, { $set: { isCompleted: true } });
    }

    public static async userStatus(userId: string): Promise<string> {
      const entry = await OnboardingHistories.findOne({ userId });

      if (entry && entry.isCompleted) {
        return 'completed';
      }

      if (entry) {
        return 'inComplete';
      }

      return 'initial';
    }
  }

  onboardingHistorySchema.loadClass(OnboardingHistory);

  return onboardingHistorySchema;
};

loadClass();
loadOnboardingHistoryClass();

// tslint:disable-next-line
export const RobotEntries = model<IRobotEntryDocument, IRobotEntryModel>('robot_entries', robotEntrySchema);

// tslint:disable-next-line
export const OnboardingHistories = model<IOnboardingHistoryDocument, IOnboardingHistoryModel>(
  'onboarding_histories',
  onboardingHistorySchema,
);
