import { Model, model } from 'mongoose';
import { ActivityLogs } from '.';
import {
  checklistItemSchema,
  checklistSchema,
  IChecklist,
  IChecklistDocument,
  IChecklistItem,
  IChecklistItemDocument,
} from './definitions/checklists';
import { IUserDocument } from './definitions/users';

export interface IChecklistModel extends Model<IChecklistDocument> {
  createChecklist(
    { contentType, contentTypeId, ...fields }: IChecklist,
    user: IUserDocument,
  ): Promise<IChecklistDocument>;

  updateChecklist(_id: string, doc: IChecklist): Promise<IChecklistDocument>;

  removeChecklist(_id: string): void;
}

export interface IChecklistItemModel extends Model<IChecklistItemDocument> {
  createChecklistItem({ checklistId, ...fields }: IChecklistItem, user: IUserDocument): Promise<IChecklistItemDocument>;

  updateChecklistItem(_id: string, doc: IChecklistItem): Promise<IChecklistDocument>;

  removeChecklistItem(_id: string): void;
}

export const loadClass = () => {
  class Checklist {
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
    /*
     * Create new checklistItem
     */
    public static async createChecklist({ checklistId, ...fields }: IChecklistItem, user: IUserDocument) {
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
     * Remove checklist
     */
    public static async removeChecklist(_id: string) {
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
