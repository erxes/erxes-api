import { ChecklistItems, Checklists } from '../../../db/models';
import { IChecklist, IChecklistItem } from '../../../db/models/definitions/checklists';
import { MODULE_NAMES } from '../../constants';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { findItemName, gatherUsernames, LogDesc } from './logUtils';

interface IChecklistsEdit extends IChecklist {
  _id: string;
}

interface IChecklistItemsEdit extends IChecklistItem {
  _id: string;
}

const checklistMutations = {
  /**
   * Adds checklist object and also adds an activity log
   */
  async checklistsAdd(_root, args: IChecklist, { user }: IContext) {
    const checklist = await Checklists.createChecklist(args, user);

    const { contentType, contentTypeId, title } = args;

    const itemName = await findItemName({ contentType, contentTypeId });

    const extraDesc: LogDesc[] = [
      { createdUserId: user._id, name: user.username || user.email },
      { contentTypeId, name: itemName },
    ];

    await putCreateLog(
      {
        type: MODULE_NAMES.CHECKLIST,
        newData: args,
        object: checklist,
        description: `"${title}" has been created in ${contentType.toUpperCase()} "${itemName}"`,
        extraDesc,
      },
      user,
    );

    return checklist;
  },

  /**
   * Updates checklist object
   */
  async checklistsEdit(_root, { _id, ...doc }: IChecklistsEdit, { user }: IContext) {
    const checklist = await Checklists.getChecklist(_id);
    const updated = await Checklists.updateChecklist(_id, doc);

    const { contentType, contentTypeId, title } = checklist;

    const itemName = await findItemName({ contentType, contentTypeId });

    let extraDesc: LogDesc[] = [{ contentTypeId, name: itemName }];

    if (checklist.createdUserId) {
      extraDesc = await gatherUsernames({
        idFields: [checklist.createdUserId],
        foreignKey: 'createdUserId',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.CHECKLIST,
        object: checklist,
        newData: doc,
        description: `"${title}" saved in ${contentType.toUpperCase()} "${itemName}" has been edited`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes a checklist
   */
  async checklistsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const checklist = await Checklists.getChecklist(_id);
    const removed = await Checklists.removeChecklist(_id);

    const { contentType, contentTypeId, createdUserId, title } = checklist;
    const itemName = await findItemName({ contentType, contentTypeId });

    const extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [createdUserId],
      foreignKey: 'createdUserId',
    });

    extraDesc.push({ contentTypeId, name: itemName });

    await putDeleteLog(
      {
        type: MODULE_NAMES.CHECKLIST,
        object: checklist,
        description: `"${title}" from ${contentType.toUpperCase()} "${itemName}" has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },

  /**
   * Adds checklistItems object and also adds an activity log
   */
  async checklistItemsAdd(_root, args: IChecklistItem, { user }: IContext) {
    const checklist = await Checklists.getChecklist(args.checklistId);

    const checklistItem = await ChecklistItems.createChecklistItem(args, user);

    const extraDesc: LogDesc[] = [
      { createdUserId: user._id, name: user.username || user.email },
      { checklistId: checklist._id, name: checklist.title },
    ];

    await putCreateLog(
      {
        type: MODULE_NAMES.CHECKLIST_ITEM,
        newData: args,
        object: checklistItem,
        description: `"${checklistItem.content}" has been added to "${checklist.title}"`,
        extraDesc,
      },
      user,
    );

    return checklistItem;
  },

  /**
   * Updates a checklist item
   */
  async checklistItemsEdit(_root, { _id, ...doc }: IChecklistItemsEdit, { user }: IContext) {
    const checklistItem = await ChecklistItems.getChecklistItem(_id);
    const checklist = await Checklists.getChecklist(checklistItem.checklistId);
    const updated = await ChecklistItems.updateChecklistItem(_id, doc);

    const extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [checklistItem.createdUserId],
      foreignKey: 'createdUserId',
    });

    extraDesc.push({ checklistId: checklist._id, name: checklist.title });

    await putUpdateLog(
      {
        type: MODULE_NAMES.CHECKLIST_ITEM,
        object: checklistItem,
        newData: doc,
        description: `"${checklistItem.content}" has been edited /checked/`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes a checklist item
   */
  async checklistItemsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const checklistItem = await ChecklistItems.getChecklistItem(_id);
    const checklist = await Checklists.getChecklist(checklistItem.checklistId);
    const removed = await ChecklistItems.removeChecklistItem(_id);

    const extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [checklistItem.createdUserId],
      foreignKey: 'createdUserId',
    });

    extraDesc.push({ checklistId: checklist._id, name: checklist.title });

    await putDeleteLog(
      {
        type: MODULE_NAMES.CHECKLIST,
        object: checklistItem,
        description: `"${checklistItem.content}" has been removed from "${checklist.title}"`,
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

moduleRequireLogin(checklistMutations);

export default checklistMutations;
