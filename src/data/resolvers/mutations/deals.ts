import { ActivityLogs, Checklists, Conformities, Deals } from '../../../db/models';
import { getCompanies, getCustomers } from '../../../db/models/boardUtils';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDeal } from '../../../db/models/definitions/deals';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import {
  copyChecklists,
  copyPipelineLabels,
  createConformity,
  IBoardNotificationParams,
  itemsChange,
  prepareBoardItemDoc,
  sendNotifications,
} from '../boardUtils';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user, docModifier }: IContext) {
    doc.initialStageId = doc.stageId;
    doc.watchedUserIds = [user._id];

    const deal = await Deals.createDeal({
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
    });

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_ADD,
      action: 'invited you to the deal',
      content: `'${deal.name}'.`,
      contentType: 'deal',
    });

    await putCreateLog(
      {
        type: 'deal',
        newData: JSON.stringify(doc),
        object: deal,
        description: `${deal.name} has been created`,
      },
      user,
    );

    return deal;
  },

  /**
   * Edit deal
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
      contentType: 'deal',
    };

    if (doc.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(oldDeal.assignedUserIds, doc.assignedUserIds);

      const activityContent = { addedUserIds, removedUserIds };

      await ActivityLogs.createAssigneLog({
        contentId: _id,
        userId: user._id,
        contentType: 'deal',
        content: activityContent,
      });

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    await putUpdateLog(
      {
        type: 'deal',
        object: updatedDeal,
        newData: JSON.stringify(doc),
        description: `${updatedDeal.name} has been edited`,
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

    const { content, action } = await itemsChange(user._id, deal, 'deal', destinationStageId);

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_CHANGE,
      content,
      action,
      contentType: 'deal',
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
      contentType: 'deal',
    });

    await putDeleteLog(
      {
        type: 'deal',
        object: deal,
        description: `${deal.name} has been removed`,
      },
      user,
    );

    await Conformities.removeConformity({ mainType: 'deal', mainTypeId: deal._id });
    await Checklists.removeChecklists('deal', deal._id);
    await ActivityLogs.removeActivityLog(deal._id);

    return deal.remove();
  },

  /**
   * Watch deal
   */
  async dealsWatch(_root, { _id, isAdd }: { _id: string; isAdd: boolean }, { user }: IContext) {
    return Deals.watchDeal(_id, isAdd, user._id);
  },

  async dealsCopy(_root, { _id }: { _id: string }, { user }: IContext) {
    const deal = await Deals.getDeal(_id);

    const doc = await prepareBoardItemDoc(_id, 'deal', user._id);

    const clone = await Deals.createDeal(doc);

    const companies = await getCompanies('deal', _id);
    const customers = await getCustomers('deal', _id);

    await createConformity({
      mainType: 'deal',
      mainTypeId: clone._id,
      customerIds: customers.map(c => c._id),
      companyIds: companies.map(c => c._id),
    });

    await copyChecklists({
      contentType: 'deal',
      contentTypeId: deal._id,
      targetContentId: clone._id,
      user,
    });

    return clone;
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');
checkPermission(dealMutations, 'dealsWatch', 'dealsWatch');

export default dealMutations;
