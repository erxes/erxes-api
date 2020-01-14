import { Model, model } from 'mongoose';
import { ActivityLogs, Companies, Conformities, Customers } from '.';
import { fillSearchTextItem, updateOrder, watchItem } from './boardUtils';
import { IItemCommonFields as ITask, IOrderInput } from './definitions/boards';
import { ICompanyDocument } from './definitions/companies';
import { ICustomerDocument } from './definitions/customers';
import { ITaskDocument, taskSchema } from './definitions/tasks';

export interface ITaskModel extends Model<ITaskDocument> {
  createTask(doc: ITask): Promise<ITaskDocument>;
  getTask(_id: string): Promise<ITaskDocument>;
  updateTask(_id: string, doc: ITask): Promise<ITaskDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<ITaskDocument[]>;
  watchTask(_id: string, isAdd: boolean, userId: string): void;
  getCustomers(_id: string): Promise<ICustomerDocument[]>;
  getCompanies(_id: string): Promise<ICompanyDocument[]>;
}

export const loadTaskClass = () => {
  class Task {
    /**
     * Retreives Task
     */
    public static async getTask(_id: string) {
      const task = await Tasks.findOne({ _id });

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    }

    /**
     * Create a Task
     */
    public static async createTask(doc: ITask) {
      if (doc.sourceConversationId) {
        const convertedTask = await Tasks.findOne({ sourceConversationId: doc.sourceConversationId });

        if (convertedTask) {
          throw new Error('Already converted a task');
        }
      }

      const tasksCount = await Tasks.find({
        stageId: doc.stageId,
      }).countDocuments();

      const task = await Tasks.create({
        ...doc,
        order: tasksCount,
        createdAt: new Date(),
        modifiedAt: new Date(),
        searchText: fillSearchTextItem(doc),
      });

      // create log
      await ActivityLogs.createBoardItemLog({ item: task, contentType: 'task' });

      return task;
    }

    /**
     * Update Task
     */
    public static async updateTask(_id: string, doc: ITask) {
      const searchText = fillSearchTextItem(doc, await Tasks.getTask(_id));

      await Tasks.updateOne({ _id }, { $set: doc, searchText });

      return Tasks.findOne({ _id });
    }

    /*
     * Update given Tasks orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      return updateOrder(Tasks, orders, stageId);
    }

    /**
     * Watch task
     */
    public static async watchTask(_id: string, isAdd: boolean, userId: string) {
      return watchItem(Tasks, _id, isAdd, userId);
    }

    public static async getCompanies(_id: string) {
      const conformities = await Conformities.find({ mainType: 'task', mainTypeId: _id, relType: 'company' });

      const companyIds = conformities.map(c => c.relTypeId);

      return Companies.find({ _id: { $in: companyIds } });
    }

    public static async getCustomers(_id: string) {
      const conformities = await Conformities.find({ mainType: 'task', mainTypeId: _id, relType: 'customer' });

      const customerIds = conformities.map(c => c.relTypeId);

      return Customers.find({ _id: { $in: customerIds } });
    }
  }

  taskSchema.loadClass(Task);

  return taskSchema;
};

loadTaskClass();

// tslint:disable-next-line
const Tasks = model<ITaskDocument, ITaskModel>('tasks', taskSchema);

export default Tasks;
