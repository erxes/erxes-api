import { Model, model } from 'mongoose';
import { Companies, Customers } from '.';
import {
  IOnboardingHistoryDocument,
  IRobotJobDocument,
  onboardingHistorySchema,
  robotJobSchema,
} from './definitions/robot';
import { IUserDocument } from './definitions/users';

// jobs ==========================
export interface IRobotJobModel extends Model<IRobotJobDocument> {
  createJob(data): Promise<IRobotJobDocument | undefined>;
  markAsNotified(_id: string): Promise<IRobotJobDocument>;
  updateOrCreate(type: string, data): Promise<IRobotJobDocument>;
}

export const loadClass = () => {
  class RobotJob {
    public static async updateOrCreate(type: string, data): Promise<IRobotJobDocument> {
      return RobotJobs.findOneAndUpdate(
        { type, data },
        { isNotified: false, createdAt: new Date() },
        { new: true, upsert: true },
      );
    }

    public static async markAsNotified(_id: string): Promise<IRobotJobDocument> {
      return RobotJobs.updateOne({ _id }, { $set: { isNotified: true } });
    }

    public static async createJob(data): Promise<IRobotJobDocument | undefined> {
      const create = (modifier: { type: string; data: any; parentId?: string }) => {
        return RobotJobs.create({ ...modifier, createdAt: new Date() });
      };

      const type = data.jobType;

      if (type === 'mergeCustomers') {
        const customerIds = data.customerIds;
        const randomCustomer = await Customers.findOne({ _id: { $in: customerIds } }).lean();

        if (randomCustomer) {
          delete randomCustomer._id;
          await Customers.mergeCustomers(customerIds, randomCustomer);
          return create({ type, data: { customerIds } });
        }
      }

      if (type === 'fillCompanyInfo') {
        const results = data.results;

        const parent = await create({ type: 'fillCompanyInfo', data: { count: results.length } });

        for (const result of results) {
          const { _id, modifier } = result;

          await Companies.update({ _id }, { $set: modifier });
          return create({ type, parentId: parent._id, data: { _id, modifier } });
        }

        return parent;
      }

      if (type === 'customerScoring') {
        const { scoreMap } = data;

        if (!scoreMap || scoreMap.length === 0) {
          return undefined;
        }

        const modifier = scoreMap.map(job => ({
          updateOne: {
            filter: {
              _id: job._id,
            },
            update: {
              $set: { profileScore: job.score },
            },
          },
        }));

        await Customers.bulkWrite(modifier);

        return create({ type, data: { scoreMap } });
      }

      if (type === 'channelsWithoutIntegration') {
        return RobotJobs.updateOrCreate('channelsWithoutIntegration', { channelIds: data.channelIds });
      }

      if (type === 'channelsWithoutMembers') {
        return RobotJobs.updateOrCreate('channelsWithoutMembers', { channelIds: data.channelIds });
      }

      if (type === 'brandsWithoutIntegration') {
        return RobotJobs.updateOrCreate('brandsWithoutIntegration', { brandIds: data.brandIds });
      }

      if (type === 'featureSuggestion') {
        return RobotJobs.updateOrCreate('featureSuggestion', { message: data.message });
      }
    }
  }

  robotJobSchema.loadClass(RobotJob);

  return robotJobSchema;
};

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

loadClass();
loadOnboardingHistoryClass();

// tslint:disable-next-line
export const RobotJobs = model<IRobotJobDocument, IRobotJobModel>('robot_jobs', robotJobSchema);

// tslint:disable-next-line
export const OnboardingHistories = model<IOnboardingHistoryDocument, IOnboardingHistoryModel>(
  'onboarding_histories',
  onboardingHistorySchema,
);
