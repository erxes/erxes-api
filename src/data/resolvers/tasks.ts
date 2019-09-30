import {
  ChecklistItems,
  Checklists,
  Companies,
  Conformities,
  Customers,
  Notifications,
  Pipelines,
  Stages,
  Users,
} from '../../db/models';
import { ITaskDocument } from '../../db/models/definitions/tasks';
import { IContext } from '../types';
import { boardId } from './boardUtils';

export default {
  async companies(task: ITaskDocument) {
    const companyIds = await Conformities.savedConformity({
      mainType: 'task',
      mainTypeId: task._id,
      relType: 'company',
    });

    return Companies.find({ _id: { $in: companyIds || [] } });
  },

  async customers(task: ITaskDocument) {
    const customerIds = await Conformities.savedConformity({
      mainType: 'task',
      mainTypeId: task._id,
      relType: 'customer',
    });

    return Customers.find({ _id: { $in: customerIds || [] } });
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

  hasNotified(deal: ITaskDocument, _args, { user }: IContext) {
    return Notifications.checkIfRead(user._id, deal._id);
  },

  async checklistsState(task: ITaskDocument, _args) {
    const checklists = await Checklists.find({ contentType: 'task', contentTypeId: task._id });
    if (!checklists) {
      return null;
    }

    const checklistIds = checklists.map(checklist => checklist._id);
    const checkItems = await ChecklistItems.find({ checklistId: { $in: checklistIds } });
    const completedItems = checkItems.filter(item => item.isChecked);

    return { completed: completedItems.length, all: checkItems.length };
  },
};
