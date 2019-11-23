import { Model, model } from 'mongoose';
import { IOnboardingHistoryDocument, onboardingHistorySchema } from './definitions/robot';
import { IUserDocument } from './definitions/users';

// onboarding ==========================
interface IGetOrCreateDoc {
  type: string;
  user: IUserDocument;
}

interface IGetOrCreateResponse {
  status: string;
  job: IOnboardingHistoryDocument;
}

interface IStepsCompletenessResponse {
  [key: string]: boolean;
}

export interface IOnboardingHistoryModel extends Model<IOnboardingHistoryDocument> {
  getOrCreate(doc: IGetOrCreateDoc): Promise<IGetOrCreateResponse>;
  stepsCompletness(steps: string[], user: IUserDocument): IStepsCompletenessResponse;
  completeShowStep(step: string, userId: string): void;
  forceComplete(userId: string): void;
  userStatus(userId: string): string;
}

export const loadOnboardingHistoryClass = () => {
  class OnboardingHistory {
    public static async getOrCreate({ type, user }: IGetOrCreateDoc): Promise<IGetOrCreateResponse> {
      const prevJob = await OnboardingHistories.findOne({ userId: user._id });

      if (!prevJob) {
        const job = await OnboardingHistories.create({ userId: user._id, completedSteps: [type] });
        return { status: 'created', job };
      }

      if (prevJob.isCompleted) {
        return { status: 'completed', job: prevJob };
      }

      if (prevJob.completedSteps.includes(type)) {
        return { status: 'prev', job: prevJob };
      }

      const updatedJob = await OnboardingHistories.updateOne({ userId: user._id }, { $push: { completedSteps: type } });

      return { status: 'created', job: updatedJob };
    }

    public static async stepsCompletness(steps: string[], user: IUserDocument): Promise<IStepsCompletenessResponse> {
      const result: IStepsCompletenessResponse = {};

      for (const step of steps) {
        const selector = { userId: user._id, completedSteps: { $in: [step] } };
        result[step] = (await OnboardingHistories.find(selector).countDocuments()) > 0;
      }

      return result;
    }

    public static async forceComplete(userId: string): Promise<IOnboardingHistoryDocument> {
      const job = await OnboardingHistories.findOne({ userId });

      if (!job) {
        return OnboardingHistories.create({ userId, isCompleted: true });
      }

      return OnboardingHistories.updateOne({ userId }, { $set: { isCompleted: true } });
    }

    public static async completeShowStep(step: string, userId: string): Promise<void> {
      return OnboardingHistories.updateOne({ userId }, { $push: { completedSteps: step } }, { upsert: true });
    }

    public static async userStatus(userId: string): Promise<string> {
      const job = await OnboardingHistories.findOne({ userId });

      if (job && job.isCompleted) {
        return 'completed';
      }

      if (job) {
        return 'inComplete';
      }

      return 'initial';
    }
  }

  onboardingHistorySchema.loadClass(OnboardingHistory);

  return onboardingHistorySchema;
};

loadOnboardingHistoryClass();

// tslint:disable-next-line
export const OnboardingHistories = model<IOnboardingHistoryDocument, IOnboardingHistoryModel>(
  'onboarding_histories',
  onboardingHistorySchema,
);
