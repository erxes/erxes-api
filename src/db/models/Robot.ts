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

export interface IOnboardingHistoryModel extends Model<IOnboardingHistoryDocument> {
  getOrCreate(doc: IGetOrCreateDoc): Promise<IGetOrCreateResponse>;
}

export const loadOnboardingHistoryClass = () => {
  class OnboardingHistory {
    public static async getOrCreate({ type, user }: IGetOrCreateDoc): Promise<IGetOrCreateResponse> {
      const action = `${type}Create`;

      let prevEntry = await OnboardingHistories.findOne({ userId: user._id, isCompleted: true });

      if (prevEntry) {
        return { status: 'completed', entry: prevEntry };
      }

      prevEntry = await OnboardingHistories.findOne({ userId: user._id, completedActions: { $in: [action] } });

      if (prevEntry) {
        return { status: 'prev', entry: prevEntry };
      }

      prevEntry = await OnboardingHistories.findOne({ userId: user._id });

      if (prevEntry) {
        await OnboardingHistories.update({ userId: user._id }, { $push: { completedActions: action } });

        return { status: 'prev', entry: prevEntry };
      }

      const entry = await OnboardingHistories.create({ userId: user._id, completedActions: [action] });

      return { status: 'created', entry };
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
