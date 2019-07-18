import { TaskTypes } from '../../../db/models';
import { ITaskType } from '../../../db/models/definitions/taskTypes';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface ITaskTypesEdit extends ITaskType {
  _id: string;
}

const taskTypeMutations = {
  /**
   * Create new taskType
   */
  async taskTypesAdd(_root, doc: ITaskType, { user }: { user: IUserDocument }) {
    const taskType = await TaskTypes.createTaskType({ ...doc });

    await putCreateLog(
      {
        type: 'taskType',
        newData: JSON.stringify(doc),
        object: taskType,
        description: `${doc.name} has been created`,
      },
      user,
    );

    return taskType;
  },

  /**
   * Update task type
   */
  async taskTypesEdit(_root, { _id, ...fields }: ITaskTypesEdit, { user }: { user: IUserDocument }) {
    const taskType = await TaskTypes.findOne({ _id });
    const updated = await TaskTypes.updateTaskType(_id, fields);

    if (taskType) {
      await putUpdateLog(
        {
          type: 'taskType',
          object: taskType,
          newData: JSON.stringify(fields),
          description: `${fields.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Delete task type
   */
  async taskTypesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const taskType = await TaskTypes.findOne({ _id });
    const removed = await TaskTypes.removeTaskType(_id);

    if (taskType && removed) {
      await putDeleteLog(
        {
          type: 'taskType',
          object: taskType,
          description: `${taskType.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(taskTypeMutations, 'manageBrands');

export default taskTypeMutations;
