import { Companies, Customers, Pipelines, Stages, Users } from '../../db/models';
import { IGrowthHackDocument } from '../../db/models/definitions/growthHacks';
import { IUserDocument } from '../../db/models/definitions/users';
import { boardId } from './boardUtils';

export default {
  companies(growthHack: IGrowthHackDocument) {
    return Companies.find({ _id: { $in: growthHack.companyIds || [] } });
  },

  customers(growthHack: IGrowthHackDocument) {
    return Customers.find({ _id: { $in: growthHack.customerIds || [] } });
  },

  assignedUsers(growthHack: IGrowthHackDocument) {
    return Users.find({ _id: { $in: growthHack.assignedUserIds } });
  },

  async pipeline(growthHack: IGrowthHackDocument) {
    const stage = await Stages.findOne({ _id: growthHack.stageId });

    if (!stage) {
      return null;
    }

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(growthHack: IGrowthHackDocument) {
    return boardId(growthHack);
  },

  async formId(growthHack: IGrowthHackDocument) {
    const stage = await Stages.findOne({ _id: growthHack.stageId });

    if (!stage) {
      return null;
    }

    return stage.formId;
  },

  stage(growthHack: IGrowthHackDocument) {
    return Stages.findOne({ _id: growthHack.stageId });
  },

  isWatched(growthHack: IGrowthHackDocument, _args, { user }: { user: IUserDocument }) {
    const watchedUserIds = growthHack.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },
};
