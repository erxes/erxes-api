import { Tasks } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { ITask } from '../../../db/models/definitions/tasks';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions/wrappers';
import { itemsChange, manageNotifications, sendNotifications } from '../boardUtils';

interface ITasksEdit extends ITask {
  _id: string;
}

const taskMutations = {
  /**
   * Create new task
   */
  async tasksAdd(_root, doc: ITask, { user }: { user: IUserDocument }) {
    const task = await Tasks.createTask({
      ...doc,
      modifiedBy: user._id,
    });

    await sendNotifications({
      stageId: task.stageId || '',
      user,
      type: NOTIFICATION_TYPES.TASK_ADD,
      assignedUsers: task.assignedUserIds || [],
      content: `'{userName}' invited you to the '${task.name}'.`,
      contentType: 'task',
    });

    return task;
  },

  /**
   * Edit task
   */
  async tasksEdit(_root, { _id, ...doc }: ITasksEdit, { user }) {
    const task = await Tasks.updateTask(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await manageNotifications(Tasks, task, user, 'task');

    return task;
  },

  /**
   * Change task
   */
  async tasksChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: { user: IUserDocument },
  ) {
    const task = await Tasks.updateTask(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const content = await itemsChange(Tasks, task, 'task', destinationStageId, user);

    await sendNotifications({
      stageId: task.stageId || '',
      user,
      type: NOTIFICATION_TYPES.TASK_CHANGE,
      assignedUsers: task.assignedUserIds || [],
      content,
      contentType: 'task',
    });

    return task;
  },

  /**
   * Update task orders (not sendNotifaction, ordered card to change)
   */
  tasksUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return Tasks.updateOrder(stageId, orders);
  },

  /**
   * Remove task
   */
  async tasksRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const task = await Tasks.findOne({ _id });

    if (!task) {
      throw new Error('Task not found');
    }

    await sendNotifications({
      stageId: task.stageId || '',
      user,
      type: NOTIFICATION_TYPES.TASK_DELETE,
      assignedUsers: task.assignedUserIds || [],
      content: `'{userName}' deleted task: '${task.name}'`,
      contentType: 'task',
    });

    return Tasks.removeTask(_id);
  },
};

checkPermission(taskMutations, 'tasksAdd', 'tasksAdd');
checkPermission(taskMutations, 'tasksEdit', 'tasksEdit');
checkPermission(taskMutations, 'tasksUpdateOrder', 'tasksUpdateOrder');
checkPermission(taskMutations, 'tasksRemove', 'tasksRemove');

export default taskMutations;
