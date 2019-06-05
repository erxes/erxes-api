import { Deals, Pipelines, Stages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { IDeal, IDealDocument } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { NOTIFICATION_TYPES } from '../../constants';
import { checkPermission } from '../../permissions';
import utils from '../../utils';

interface IDealsEdit extends IDeal {
  _id: string;
}

/**
 * Send notification to all members of this deal except the sender
 */
export const sendDealNotifications = async (
  deal: IDealDocument,
  user: IUserDocument,
  type: string,
  assignedUsers: string[],
  content: string,
) => {
  const stage = await Stages.findOne({ _id: deal.stageId });

  if (!stage) {
    throw new Error('Stage not found');
  }

  const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  return utils.sendNotification({
    createdUser: user._id,
    notifType: type,
    title: content,
    content,
    link: `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,

    // exclude current user
    receivers: (assignedUsers || []).filter(id => id !== user._id),
  });
};

const dealMutations = {
  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    const deal = await Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });

    await sendDealNotifications(
      deal,
      user,
      NOTIFICATION_TYPES.DEAL_ADD,
      deal.assignedUserIds || [],
      `'{userName}' invited you to the '${deal.name}'.`,
    );

    return deal;
  },

  /**
   * Edit deal
   */
  async dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }) {
    const oldDeal = await Deals.findOne({ _id });
    const oldAssignedUserIds = oldDeal ? oldDeal.assignedUserIds || [] : [];

    const deal = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
    const assignedUserIds = deal.assignedUserIds || [];

    // new assignee users
    const newUserIds = assignedUserIds.filter(userId => oldAssignedUserIds.indexOf(userId) < 0);

    if (newUserIds.length > 0) {
      await sendDealNotifications(
        deal,
        user,
        NOTIFICATION_TYPES.DEAL_ADD,
        newUserIds,
        `'{userName}' invited you to the deal: '${deal.name}'.`,
      );
    }

    // remove from assignee users
    const removedUserIds = oldAssignedUserIds.filter(userId => assignedUserIds.indexOf(userId) < 0);

    if (removedUserIds.length > 0) {
      await sendDealNotifications(
        deal,
        user,
        NOTIFICATION_TYPES.DEAL_REMOVE_ASSIGN,
        removedUserIds,
        `'{userName}' removed you from deal: '${deal.name}'.`,
      );
    }

    // dont assignee change and other edit
    if (removedUserIds.length === 0 && newUserIds.length === 0) {
      await sendDealNotifications(
        deal,
        user,
        NOTIFICATION_TYPES.DEAL_EDIT,
        assignedUserIds,
        `'{userName}' edited your deal '${deal.name}'`,
      );
    }

    return deal;
  },

  /**
   * Change deal
   */
  async dealsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId?: string },
    { user }: { user: IUserDocument },
  ) {
    const oldDeal = await Deals.findOne({ _id });
    const oldStageId = oldDeal ? oldDeal.stageId || '' : '';

    const deal = await Deals.updateDeal(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    let content = `'{userName}' changed order your deal:'${deal.name}'`;

    if (oldStageId !== destinationStageId) {
      const stage = await Stages.findOne({ _id: destinationStageId });

      if (!stage) {
        throw new Error('Stage not found');
      }

      content = `'{userName}' moved your deal '${deal.name}' to the '${stage.name}'.`;
    }

    await sendDealNotifications(deal, user, NOTIFICATION_TYPES.DEAL_CHANGE, deal.assignedUserIds || [], content);

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

    await sendDealNotifications(
      deal,
      user,
      NOTIFICATION_TYPES.DEAL_DELETE,
      deal.assignedUserIds || [],
      `'{userName}' deleted deal: '${deal.name}'`,
    );

    return Deals.removeDeal(_id);
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
