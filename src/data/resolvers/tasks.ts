import { Companies, Customers, Pipelines, Stages, Users } from '../../db/models';
import { ITaskDocument } from '../../db/models/definitions/tasks';
import { IContext } from '../types';
import { boardId } from './boardUtils';

export default {
  companies(task: ITaskDocument) {
    return Companies.find({ _id: { $in: task.companyIds || [] } });
  },

  customers(task: ITaskDocument) {
    return Customers.find({ _id: { $in: task.customerIds || [] } });
  },

  assignedUsers(task: ITaskDocument) {
    return Users.find({ _id: { $in: task.assignedUserIds } });
  },

  async pipeline(task: ITaskDocument) {
    const stage = await Stages.getStage(task.stageId || '');

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(task: ITaskDocument) {
    return boardId(task);
  },

  stage(task: ITaskDocument) {
    return Stages.getStage(task.stageId || '');
  },

  isWatched(task: ITaskDocument, _args, { user }: IContext) {
    const watchedUserIds = task.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },
};
