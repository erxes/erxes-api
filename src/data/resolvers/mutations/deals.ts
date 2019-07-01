import { Deals } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDeal } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions/wrappers';
import { getUserDetail, itemsChange, sendNotifications } from '../boardUtils';
import { checkUserIds } from './notifications';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    const deal = await Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_ADD,
      assignedUsers: deal.assignedUserIds || [],
      content: `'${getUserDetail(user)}' invited you to the '${deal.name}'.`,
      contentType: 'deal',
    });

    return deal;
  },

  /**
   * Edit deal
   */
  async dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }) {
    const oldDeal = await Deals.findOne({ _id });

    if (!oldDeal) {
      throw new Error('Deal not found');
    }

    const updatedDeal = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    const { addedUserIds, removedUserIds } = checkUserIds(oldDeal.assignedUserIds || [], doc.assignedUserIds || []);

    await sendNotifications({
      item: updatedDeal,
      user,
      type: NOTIFICATION_TYPES.DEAL_EDIT,
      assignedUsers: updatedDeal.assignedUserIds || [],
      invitedUsers: addedUserIds,
      removedUsers: removedUserIds,
      contentType: 'deal',
    });

    return updatedDeal;
  },

  /**
   * Change deal
   */
  async dealsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: { user: IUserDocument },
  ) {
    const deal = await Deals.findOne({ _id });

    if (!deal) {
      throw new Error('Deal not found');
    }

    await Deals.updateDeal(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const content = await itemsChange(Deals, deal, 'deal', destinationStageId, user);

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_CHANGE,
      assignedUsers: deal.assignedUserIds || [],
      content,
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
  async dealsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const deal = await Deals.findOne({ _id });

    if (!deal) {
      throw new Error('Deal not found');
    }

    await sendNotifications({
      item: deal,
      user,
      type: NOTIFICATION_TYPES.DEAL_DELETE,
      assignedUsers: deal.assignedUserIds || [],
      content: `'${getUserDetail(user)}' deleted deal: '${deal.name}'`,
      contentType: 'deal',
    });

    return Deals.removeDeal(_id);
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
