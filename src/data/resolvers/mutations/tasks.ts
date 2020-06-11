import { ActivityLogs, Checklists, Conformities, Stages, Tasks } from '../../../db/models';
import { getCompanies, getCustomers, getNewOrder } from '../../../db/models/boardUtils';
import { IItemCommonFields as ITask, IItemDragCommonFields } from '../../../db/models/definitions/boards';
import { BOARD_STATUSES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { graphqlPubsub } from '../../../pubsub';
import { MODULE_NAMES } from '../../constants';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, registerOnboardHistory } from '../../utils';
import {
  copyChecklists,
  copyPipelineLabels,
  createConformity,
  IBoardNotificationParams,
  itemsChange,
  itemStatusChange,
  prepareBoardItemDoc,
  sendNotifications,
} from '../boardUtils';

interface ITasksEdit extends ITask {
  _id: string;
}

const taskMutations = {
  /**
   * Creates a new task
   */
  async tasksAdd(_root, doc: ITask & { proccessId: string; aboveItemId: string }, { user, docModifier }: IContext) {
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
      order: await getNewOrder({ collection: Tasks, stageId: doc.stageId, aboveItemId: doc.aboveItemId }),
    };

    const task = await Tasks.createTask(extendedDoc);

    await createConformity({
      mainType: MODULE_NAMES.TASK,
      mainTypeId: task._id,
      companyIds: doc.companyIds,
      customerIds: doc.customerIds,
    });

    await sendNotifications({
      item: task,
      user,
      type: NOTIFICATION_TYPES.TASK_ADD,
      action: `invited you to the`,
      content: `'${task.name}'.`,
      contentType: MODULE_NAMES.TASK,
    });

    await putCreateLog(
      {
        type: MODULE_NAMES.TASK,
        newData: extendedDoc,
        object: task,
      },
      user,
    );

    const stage = await Stages.getStage(task.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId: doc.proccessId,
        action: 'itemAdd',
        data: {
          item: task,
          aboveItemId: doc.aboveItemId,
          destinationStageId: stage._id,
        },
      },
    });

    return task;
  },

  /**
   * Edit task
   */
  async tasksEdit(_root, { _id, proccessId, ...doc }: ITasksEdit & { proccessId: string }, { user }: IContext) {
    const oldTask = await Tasks.getTask(_id);

    const extendedDoc = {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    };

    const updatedTask = await Tasks.updateTask(_id, extendedDoc);

    // labels should be copied to newly moved pipeline
    if (doc.stageId) {
      await copyPipelineLabels({ item: oldTask, doc, user });
    }

    const notificationDoc: IBoardNotificationParams = {
      item: updatedTask,
      user,
      type: NOTIFICATION_TYPES.TASK_EDIT,
      contentType: MODULE_NAMES.TASK,
    };

    const stage = await Stages.getStage(updatedTask.stageId);

    if (doc.status && oldTask.status && oldTask.status !== doc.status) {
      const activityAction = doc.status === 'active' ? 'activated' : 'archived';

      await ActivityLogs.createArchiveLog({
        item: updatedTask,
        contentType: 'task',
        action: activityAction,
        userId: user._id,
      });

      // order notification
      const { publishAction, data } = await itemStatusChange({
        type: 'task', item: updatedTask, status: activityAction
      });

      graphqlPubsub.publish('pipelinesChanged', {
        pipelinesChanged: {
          _id: stage.pipelineId,
          proccessId,
          action: publishAction,
          data,
        },
      });
    }

    if (doc.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(oldTask.assignedUserIds, doc.assignedUserIds);

      const activityContent = { addedUserIds, removedUserIds };

      await ActivityLogs.createAssigneLog({
        contentId: _id,
        userId: user._id,
        contentType: 'task',
        content: activityContent,
      });

      await registerOnboardHistory({ type: 'taskAssignUser', user });

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.TASK,
        object: oldTask,
        newData: extendedDoc,
        updatedDocument: updatedTask,
      },
      user,
    );

    if (oldTask.stageId === updatedTask.stageId) {
      graphqlPubsub.publish('tasksChanged', {
        tasksChanged: updatedTask,
      });

      return updatedTask;
    }

    // if task moves between stages
    const { content, action } = await itemsChange(user._id, oldTask, MODULE_NAMES.TASK, updatedTask.stageId);

    await sendNotifications({
      item: updatedTask,
      user,
      type: NOTIFICATION_TYPES.TASK_CHANGE,
      content,
      action,
      contentType: MODULE_NAMES.TASK,
    });

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'orderUpdated',
        data: {
          item: updatedTask,
        },
      },
    });

    return updatedTask;
  },

  /**
   * Change task
   */
  async tasksChange(_root, doc: IItemDragCommonFields, { user }: IContext) {
    const { proccessId, itemId, aboveItemId, destinationStageId, sourceStageId } = doc

    const task = await Tasks.getTask(itemId);

    const extendedDoc = {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
      order: await getNewOrder({ collection: Tasks, stageId: destinationStageId, aboveItemId }),
    };

    const updatedTask = await Tasks.updateTask(itemId, extendedDoc);

    const { content, action } = await itemsChange(user._id, task, MODULE_NAMES.TASK, destinationStageId);

    await sendNotifications({
      item: task,
      user,
      type: NOTIFICATION_TYPES.TASK_CHANGE,
      action,
      content,
      contentType: MODULE_NAMES.TASK,
    });

    await putUpdateLog(
      {
        type: MODULE_NAMES.TASK,
        object: task,
        newData: extendedDoc,
        updatedDocument: updatedTask,
      },
      user,
    );

    // order notification
    const stage = await Stages.getStage(task.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'orderUpdated',
        data: {
          item: task,
          aboveItemId,
          destinationStageId,
          oldStageId: sourceStageId,
        },
      },
    });

    return task;
  },

  /**
   * Remove task
   */
  async tasksRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const task = await Tasks.getTask(_id);

    await sendNotifications({
      item: task,
      user,
      type: NOTIFICATION_TYPES.TASK_DELETE,
      action: `deleted task:`,
      content: `'${task.name}'`,
      contentType: MODULE_NAMES.TASK,
    });

    await Conformities.removeConformity({ mainType: MODULE_NAMES.TASK, mainTypeId: task._id });
    await Checklists.removeChecklists(MODULE_NAMES.TASK, task._id);
    await ActivityLogs.removeActivityLog(task._id);

    const removed = await task.remove();

    await putDeleteLog({ type: MODULE_NAMES.TASK, object: task }, user);

    return removed;
  },

  /**
   * Watch task
   */
  async tasksWatch(_root, { _id, isAdd }: { _id: string; isAdd: boolean }, { user }: IContext) {
    return Tasks.watchTask(_id, isAdd, user._id);
  },

  async tasksCopy(_root, { _id, proccessId }: { _id: string; proccessId: string }, { user }: IContext) {
    const task = await Tasks.getTask(_id);

    const doc = await prepareBoardItemDoc(_id, 'task', user._id);

    const clone = await Tasks.createTask(doc);

    const companies = await getCompanies('task', _id);
    const customers = await getCustomers('task', _id);

    await createConformity({
      mainType: 'task',
      mainTypeId: clone._id,
      customerIds: customers.map(c => c._id),
      companyIds: companies.map(c => c._id),
    });
    await copyChecklists({
      contentType: 'task',
      contentTypeId: task._id,
      targetContentId: clone._id,
      user,
    });

    // order notification
    const stage = await Stages.getStage(clone.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'itemAdd',
        data: {
          item: clone,
          aboveItemId: _id,
          destinationStageId: stage._id,
        },
      },
    });

    return clone;
  },

  async tasksArchive(_root, { stageId, proccessId }: { stageId: string, proccessId: string }, { user }: IContext) {
    const tasks = await Tasks.find({stageId, status: {$ne: BOARD_STATUSES.ARCHIVED}});

    await Tasks.updateMany({ stageId }, { $set: { status: BOARD_STATUSES.ARCHIVED } });

    for (const task of tasks) {
      await ActivityLogs.createArchiveLog({
        item: task,
        contentType: 'task',
        action: 'archive',
        userId: user._id,
      });
    }

    // order notification
    const stage = await Stages.getStage(stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'itemsRemove',
        data: {
          destinationStageId: stage._id,
        },
      },
    });

    return 'ok';
  },
};

checkPermission(taskMutations, 'tasksAdd', 'tasksAdd');
checkPermission(taskMutations, 'tasksEdit', 'tasksEdit');
checkPermission(taskMutations, 'tasksRemove', 'tasksRemove');
checkPermission(taskMutations, 'tasksWatch', 'tasksWatch');
checkPermission(taskMutations, 'tasksArchive', 'tasksArchive');

export default taskMutations;
