import { Deals } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDeal } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';
import { itemsChange, manageNotifications, sendNotifications } from '../boardUtils';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    doc.initialStageId = doc.stageId;
    const deal = await Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });

    await sendNotifications(
      deal.stageId || '',
      user,
      NOTIFICATION_TYPES.DEAL_ADD,
      deal.assignedUserIds || [],
      `'{userName}' invited you to the '${deal.name}'.`,
      'deal',
    );

    await putLog(
      {
        type: 'deal',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(doc),
        objectId: deal._id,
        description: `${deal.name} has been created`,
      },
      user,
    );

    return deal;
  },

  /**
   * Edit deal
   */
  async dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }: { user: IUserDocument }) {
    const found = await Deals.findOne({ _id });
    const updated = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await manageNotifications(Deals, updated, user, 'deal');

    if (found) {
      await putLog(
        {
          type: 'deal',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(found),
          newData: JSON.stringify(doc),
          objectId: _id,
          description: `${found.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Change deal
   */
  async dealsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: { user: IUserDocument },
  ) {
    const deal = await Deals.updateDeal(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const content = await itemsChange(Deals, deal, 'deal', destinationStageId);

    await sendNotifications(
      deal.stageId || '',
      user,
      NOTIFICATION_TYPES.DEAL_CHANGE,
      deal.assignedUserIds || [],
      content,
      'deal',
    );

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
  async dealsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const deal = await Deals.findOne({ _id });

    if (!deal) {
      throw new Error('Deal not found');
    }

    await sendNotifications(
      deal.stageId || '',
      user,
      NOTIFICATION_TYPES.DEAL_DELETE,
      deal.assignedUserIds || [],
      `'${user.username}' deleted deal: '${deal.name}'`,
      'deal',
    );

    const removed = await Deals.removeDeal(_id);

    await putLog(
      {
        type: 'deal',
        action: LOG_ACTIONS.DELETE,
        oldData: JSON.stringify(deal),
        objectId: _id,
        description: `${deal.name} has been removed`,
      },
      user,
    );

    return removed;
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
