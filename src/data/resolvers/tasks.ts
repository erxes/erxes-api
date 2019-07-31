import { Companies, Deals, Pipelines, Stages, TaskTypes, Tickets, Users } from '../../db/models';
import { TASK_TYPES } from '../../db/models/definitions/constants';
import { ITaskDocument } from '../../db/models/definitions/tasks';
import { IUserDocument } from '../../db/models/definitions/users';
import { boardId } from './boardUtils';

export default {
  content(task: ITaskDocument) {
    switch (task.contentType) {
      case TASK_TYPES.DEAL: {
        return Deals.findOne({ _id: task.contentId });
      }
      case TASK_TYPES.TICKET: {
        return Tickets.findOne({ _id: task.contentId });
      }
      case TASK_TYPES.COMPANY: {
        return Companies.find({ _id: task.contentId });
      }
      case TASK_TYPES.CUSTOMER: {
        return Companies.find({ _id: task.contentId });
      }
    }
  },

  type(task: ITaskDocument) {
    return TaskTypes.findOne({ _id: task.typeId });
  },

  assignedUsers(task: ITaskDocument) {
    return Users.find({ _id: { $in: task.assignedUserIds } });
  },

  async pipeline(task: ITaskDocument) {
    const stage = await Stages.findOne({ _id: task.stageId });

    if (!stage) {
      return null;
    }

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(task: ITaskDocument) {
    return boardId(task);
  },

  stage(task: ITaskDocument) {
    return Stages.findOne({ _id: task.stageId });
  },

  isWatched(task: ITaskDocument, _args, { user }: { user: IUserDocument }) {
    const watchedUserIds = task.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },
};
