import * as _ from 'underscore';
import { ActivityLogs, Checklists, Conformities, Deals } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDeal } from '../../../db/models/definitions/deals';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { createConformity, IBoardNotificationParams, itemsChange, sendNotifications } from '../boardUtils';
import { gatherLabels, gatherProducts, gatherStages, gatherUsernames, LogDesc } from './logUtils';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Creates a new deal
   */
  async dealsAdd(_root, doc: IDeal, { user }: IContext) {
    const extendedDoc = {
      ...doc,
      initialStageId: doc.stageId,
      watchedUserIds: [user._id],
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

    const usernameOrEmail = user.username || user.email;

    let extraDesc: LogDesc[] = [
      { modifiedBy: user._id, name: usernameOrEmail },
      { userId: user._id, name: usernameOrEmail },
    ];

    extraDesc = await gatherUsernames({
      idFields: [user._id],
      foreignKey: 'watchedUserIds',
      prevList: extraDesc,
    });

    extraDesc = await gatherStages({
      idFields: [doc.stageId],
      foreignKey: 'initialStageId',
      prevList: extraDesc,
    });

    extraDesc = await gatherStages({
      idFields: [doc.stageId],
      foreignKey: 'stageId',
      prevList: extraDesc,
    });

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

    let assignedUsers = oldDeal.assignedUserIds || [];
    let extraDesc: LogDesc[] = [{ modifiedBy: user._id, name: user.username || user.email }];
    let productIds: string[] = [];

    const notificationDoc: IBoardNotificationParams = {
      item: updatedDeal,
      user,
      type: NOTIFICATION_TYPES.DEAL_EDIT,
      action: `has updated deal`,
      content: `${updatedDeal.name}`,
      contentType: MODULE_NAMES.DEAL,
    };

    if (doc.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(oldDeal.assignedUserIds || [], doc.assignedUserIds);

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;

      // no duplicate entries in log desc
      assignedUsers = assignedUsers.concat(doc.assignedUserIds);
      assignedUsers = _.uniq(assignedUsers);
    }

    // watchedUserIds are added one by one from by dealsWatch mutation below
    // therefore doc doesn't contain them
    if (oldDeal.watchedUserIds && oldDeal.watchedUserIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: oldDeal.watchedUserIds,
        foreignKey: 'watchedUserIds',
        prevList: extraDesc,
      });
    }

    if (assignedUsers.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: assignedUsers,
        foreignKey: 'assignedUserIds',
        prevList: extraDesc,
      });
    }

    if (oldDeal.userId) {
      extraDesc = await gatherUsernames({
        idFields: [oldDeal.userId],
        foreignKey: 'userId',
        prevList: extraDesc,
      });
    }

    if (oldDeal.labelIds && oldDeal.labelIds.length > 0) {
      extraDesc = await gatherLabels({
        idFields: oldDeal.labelIds,
        foreignKey: 'labelIds',
        prevList: extraDesc,
      });
    }

    extraDesc = await gatherStages({
      idFields: [oldDeal.stageId],
      foreignKey: 'stageId',
      prevList: extraDesc,
    });

    if (oldDeal.initialStageId) {
      extraDesc = await gatherStages({
        idFields: [oldDeal.initialStageId],
        foreignKey: 'initialStageId',
        prevList: extraDesc,
      });
    }

    if (oldDeal.productsData && oldDeal.productsData.length > 0) {
      productIds = oldDeal.productsData.map(p => p.productId);
    }

    if (doc.productsData && doc.productsData.length > 0) {
      productIds = productIds.concat(doc.productsData.map(p => p.productId));

      productIds = _.uniq(productIds);
    }

    if (productIds.length > 0) {
      extraDesc = await gatherProducts({
        idFields: productIds,
        foreignKey: 'productId',
        prevList: extraDesc,
      });
    }

    await sendNotifications(notificationDoc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.DEAL,
        object: updatedDeal,
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

    await putDeleteLog(
      {
        type: MODULE_NAMES.DEAL,
        object: deal,
        description: `${deal.name} has been removed`,
      },
      user,
    );

    await Conformities.removeConformity({ mainType: MODULE_NAMES.DEAL, mainTypeId: deal._id });
    await Checklists.removeChecklists(MODULE_NAMES.DEAL, deal._id);
    await ActivityLogs.removeActivityLog(deal._id);

    return deal.remove();
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
