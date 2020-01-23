import * as _ from 'underscore';
import { ActivityLogs, Checklists, Conformities, Deals } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDeal } from '../../../db/models/definitions/deals';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import {
  copyPipelineLabels,
  createConformity,
  IBoardNotificationParams,
  itemsChange,
  sendNotifications,
} from '../boardUtils';
import { gatherDealFieldNames, LogDesc } from './logUtils';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Creates a new deal
   */
  async dealsAdd(_root, doc: IDeal, { user, docModifier }: IContext) {
    doc.initialStageId = doc.stageId;
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
    };

    const deal = await Deals.createDeal(extendedDoc);

    await createConformity({
      mainType: MODULE_NAMES.DEAL,
      mainTypeId: deal._id,
      customerIds: doc.customerIds,
      companyIds: doc.companyIds,
    });

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_ADD,
      action: 'invited you to the deal',
      content: `'${deal.name}'.`,
      contentType: MODULE_NAMES.DEAL,
    });

    const extraDesc: LogDesc[] = await gatherDealFieldNames(deal);

    await putCreateLog(
      {
        type: MODULE_NAMES.DEAL,
        newData: JSON.stringify(extendedDoc),
        object: deal,
        description: `"${deal.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return deal;
  },

  /**
   * Edits a deal
   */
  async dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }: IContext) {
    const oldDeal = await Deals.getDeal(_id);

    const updatedDeal = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await copyPipelineLabels({ item: oldDeal, doc, user });

    const notificationDoc: IBoardNotificationParams = {
      item: updatedDeal,
      user,
      type: NOTIFICATION_TYPES.DEAL_EDIT,
      action: `has updated deal`,
      content: `${updatedDeal.name}`,
      contentType: MODULE_NAMES.DEAL,
    };

    if (doc.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(oldDeal.assignedUserIds, doc.assignedUserIds);

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    let extraDesc: LogDesc[] = await gatherDealFieldNames(oldDeal);

    extraDesc = await gatherDealFieldNames(updatedDeal, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.DEAL,
        object: oldDeal,
        newData: JSON.stringify(doc),
        description: `"${updatedDeal.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updatedDeal;
  },

  /**
   * Change deal
   */
  async dealsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: IContext,
  ) {
    const deal = await Deals.getDeal(_id);

    await Deals.updateDeal(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const { content, action } = await itemsChange(user._id, deal, MODULE_NAMES.DEAL, destinationStageId);

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_CHANGE,
      content,
      action,
      contentType: MODULE_NAMES.DEAL,
    });

    return deal;
  },

  /**
   * Update deal orders (not sendNotifaction, ordered card to change)
   */
  dealsUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return Deals.updateOrder(stageId, orders);
  },

  /**
   * Remove deal
   */
  async dealsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const deal = await Deals.getDeal(_id);

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_DELETE,
      action: `deleted deal:`,
      content: `'${deal.name}'`,
      contentType: MODULE_NAMES.DEAL,
    });

    await Conformities.removeConformity({ mainType: MODULE_NAMES.DEAL, mainTypeId: deal._id });
    await Checklists.removeChecklists(MODULE_NAMES.DEAL, deal._id);
    await ActivityLogs.removeActivityLog(deal._id);

    const removed = await deal.remove();

    const extraDesc: LogDesc[] = await gatherDealFieldNames(deal);

    await putDeleteLog(
      {
        type: MODULE_NAMES.DEAL,
        object: deal,
        description: `"${deal.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },

  /**
   * Watch deal
   */
  async dealsWatch(_root, { _id, isAdd }: { _id: string; isAdd: boolean }, { user }: IContext) {
    return Deals.watchDeal(_id, isAdd, user._id);
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');
checkPermission(dealMutations, 'dealsWatch', 'dealsWatch');

export default dealMutations;
