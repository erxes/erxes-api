import { Model, model } from 'mongoose';
import { ActivityLogs } from '.';
import {
  checklistItemSchema,
  checklistSchema,
  IChecklist,
  IChecklistDocument,
  IChecklistItem,
  IChecklistItemDocument,
  IOrderInput,
} from './definitions/checklists';
import { IUserDocument } from './definitions/users';

export interface IChecklistModel extends Model<IChecklistDocument> {
  getChecklist(_id: string): Promise<IChecklistDocument>;
  getChecklistsState(contentType: string, contentTypeId: string): Promise<{ complete: number; all: number }>;
  createChecklist(
    { contentType, contentTypeId, ...fields }: IChecklist,
    user: IUserDocument,
  ): Promise<IChecklistDocument>;

  updateChecklist(_id: string, doc: IChecklist): Promise<IChecklistDocument>;

  removeChecklist(_id: string): void;
}

export interface IChecklistItemModel extends Model<IChecklistItemDocument> {
  getChecklistItem(_id: string): Promise<IChecklistItemDocument>;
  createChecklistItem({ checklistId, ...fields }: IChecklistItem, user: IUserDocument): Promise<IChecklistItemDocument>;

  updateChecklistItem(_id: string, doc: IChecklistItem): Promise<IChecklistDocument>;
  updateOrderItems(orders: IOrderInput[]): Promise<IChecklistItemDocument[]>;
  removeChecklistItem(_id: string): void;
}

export const loadClass = () => {
  class Checklist {
    public static async getChecklist(_id: string) {
      const checklist = await Checklists.findOne({ _id });

      if (!checklist) {
        throw new Error('Checklist not found');
      }

      return checklist;
    }

    public static async getChecklistsState(contentType: string, contentTypeId: string) {
      const checklists = await Checklists.find({ contentType, contentTypeId });
      if (!checklists) {
        return null;
      }

      const checklistIds = checklists.map(checklist => checklist._id);
      const checkItems = await ChecklistItems.find({ checklistId: { $in: checklistIds } });
      const completedItems = checkItems.filter(item => item.isChecked);

      return { complete: completedItems.length, all: checkItems.length };
    }

    /*
     * Create new checklist
     */
    public static async createChecklist({ contentType, contentTypeId, ...fields }: IChecklist, user: IUserDocument) {
      const checklist = await Checklists.create({
        contentType,
        contentTypeId,
        createdUserId: user._id,
        createdDate: new Date(),
        ...fields,
      });

      // create log
      await ActivityLogs.createChecklistLog(checklist);

      return checklist;
    }

    /*
     * Update checklist
     */
    public static async updateChecklist(_id: string, doc: IChecklist) {
      await Checklists.updateOne({ _id }, { $set: doc });

      return Checklists.findOne({ _id });
    }

    /*
     * Remove checklist
     */
    public static async removeChecklist(_id: string) {
      const checklistObj = await Checklists.findOne({ _id });

      if (!checklistObj) {
        throw new Error(`Checklist not found with id ${_id}`);
      }

      await ChecklistItems.deleteMany({
        checklistId: checklistObj._id,
      });

      return checklistObj.remove();
    }
  }

  checklistSchema.loadClass(Checklist);

  return checklistSchema;
};

export const loadItemClass = () => {
  class ChecklistItem {
    public static async getChecklistItem(_id: string) {
      const checklistItem = await ChecklistItems.findOne({ _id });

      if (!checklistItem) {
        throw new Error('ChecklistItem not found');
      }

      return checklistItem;
    }

    /*
     * Create new checklistItem
     */
    public static async createChecklistItem({ checklistId, ...fields }: IChecklistItem, user: IUserDocument) {
      const checklistItem = await ChecklistItems.create({
        checklistId,
        createdUserId: user._id,
        createdDate: new Date(),
        ...fields,
      });

      return checklistItem;
    }

    /*
     * Update checklistItem
     */
    public static async updateChecklistItem(_id: string, doc: IChecklistItem) {
      await ChecklistItems.updateOne({ _id }, { $set: doc });

      return ChecklistItems.findOne({ _id });
    }

    /*
     * Update given items orders
     */
    public static async updateOrderItems(orders: IOrderInput[]) {
      const ids: string[] = [];

      for (const { _id, order } of orders) {
        ids.push(_id);

        // update each fields order
        await ChecklistItems.updateOne({ _id }, { order });
      }

      return ChecklistItems.find({ _id: { $in: ids } }).sort({ order: 1 });
    }

    /*
     * Remove checklist
     */
    public static async removeChecklistItem(_id: string) {
      const checklistItem = await ChecklistItems.findOne({ _id });

      if (!checklistItem) {
        throw new Error(`Checklist's item not found with id ${_id}`);
      }

      return checklistItem.remove();
    }
  }

  checklistItemSchema.loadClass(ChecklistItem);

  return checklistItemSchema;
};

loadClass();
loadItemClass();

// tslint:disable-next-line
const Checklists = model<IChecklistDocument, IChecklistModel>('checklists', checklistSchema);

// tslint:disable-next-line
const ChecklistItems = model<IChecklistItemDocument, IChecklistItemModel>('checklist_items', checklistItemSchema);

export { Checklists, ChecklistItems };
