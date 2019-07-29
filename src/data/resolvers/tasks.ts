import { Companies, Customers, Deals, Pipelines, Stages, TaskTypes, Tickets, Users } from '../../db/models';
import { ITaskDocument } from '../../db/models/definitions/tasks';
import { IUserDocument } from '../../db/models/definitions/users';
import { boardId } from './boardUtils';

export default {
  deal(task: ITaskDocument) {
    return Deals.findOne({ _id: task.dealId });
  },

  ticket(task: ITaskDocument) {
    return Tickets.findOne({ _id: task.ticketId });
  },

  type(task: ITaskDocument) {
    return TaskTypes.findOne({ _id: task.typeId });
  },

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
