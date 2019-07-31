import { Model, model } from 'mongoose';
import { ITaskType, ITaskTypeDocument, taskTypeSchema } from './definitions/taskTypes';
import Tasks from './Tasks';

export interface ITaskTypeModel extends Model<ITaskTypeDocument> {
  getTaskType(_id: string): Promise<ITaskTypeDocument>;
  createTaskType(doc: ITaskType): ITaskTypeDocument;
  updateTaskType(_id: string, fields: ITaskType): ITaskTypeDocument;
  removeTaskType(_id: string): void;
}

export const loadTaskClass = () => {
  class TaskType {
    /**
     * Get Task type
     */

    public static async getTaskType(_id: string) {
      const task = await TaskTypes.findOne({ _id });

      if (!task) {
        throw new Error('Task type not found');
      }

      return task;
    }
    /**
     * Create Task type
     */
    public static async createTaskType(doc: ITaskType) {
      return TaskTypes.create({
        ...doc,
      });
    }

    /**
     * Create Task type
     */

    public static async updateTaskType(_id: string, fields: ITaskType) {
      await TaskTypes.updateOne({ _id }, { $set: { ...fields } });
      return TaskTypes.findOne({ _id });
    }

    /**
     * Create Task type
     */

    public static async removeTaskType(_id) {
      const taskTypeObj = await TaskTypes.findOne({ _id });

      if (!taskTypeObj) {
        throw new Error(`Task type not found with id ${_id}`);
      }

      const count = await Tasks.find({ typeId: _id }).countDocuments();

      if (count > 0) {
        throw new Error("Can't remove this task type");
      }

      return taskTypeObj.remove();
    }
  }

  taskTypeSchema.loadClass(TaskType);

  return taskTypeSchema;
};

loadTaskClass();

// tslint:disable-next-line
const TaskTypes = model<ITaskTypeDocument, ITaskTypeModel>('tasks_types', taskTypeSchema);

export default TaskTypes;
