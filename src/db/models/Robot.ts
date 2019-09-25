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

interface IActionsCompletenessResponse {
  [key: string]: boolean;
}

export interface IOnboardingHistoryModel extends Model<IOnboardingHistoryDocument> {
  getOrCreate(doc: IGetOrCreateDoc): Promise<IGetOrCreateResponse>;
  actionsCompletness(actions: string[], user: IUserDocument): IActionsCompletenessResponse;
  forceComplete(userId: string): void;
  userStatus(userId: string): string;
}

export const loadOnboardingHistoryClass = () => {
  class OnboardingHistory {
    public static async getOrCreate({ type, user }: IGetOrCreateDoc): Promise<IGetOrCreateResponse> {
      const action = `${type}Create`;

      const prevEntry = await OnboardingHistories.findOne({ userId: user._id });

      if (!prevEntry) {
        const entry = await OnboardingHistories.create({ userId: user._id, completedActions: [action] });
        return { status: 'created', entry };
      }

      if (prevEntry.isCompleted) {
        return { status: 'completed', entry: prevEntry };
      }

      if (prevEntry.completedActions.includes(action)) {
        return { status: 'prev', entry: prevEntry };
      }

      const updatedEntry = await OnboardingHistories.updateOne(
        { userId: user._id },
        { $push: { completedActions: action } },
      );

      return { status: 'prev', entry: updatedEntry };
    }

    public static async actionsCompletness(
      actions: string[],
      user: IUserDocument,
    ): Promise<IActionsCompletenessResponse> {
      const result: IActionsCompletenessResponse = {};

      for (const action of actions) {
        const selector = { userId: user._id, completedActions: { $in: [action] } };
        result[action] = (await OnboardingHistories.find(selector).countDocuments()) > 0;
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
