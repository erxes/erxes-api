import { DealBoards, DealPipelines, Deals, DealStages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/Deals';
import { IBoard, IDeal, IDealDocument, IPipeline, IStage, IStageDocument } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { NOTIFICATION_TYPES } from '../../constants';
import { checkPermission } from '../../permissions';
import utils from '../../utils';

interface IDealBoardsEdit extends IBoard {
  _id: string;
}

interface IDealPipelinesAdd extends IPipeline {
  stages: IStageDocument[];
}

interface IDealPipelinesEdit extends IDealPipelinesAdd {
  _id: string;
}

interface IDealStagesEdit extends IStage {
  _id: string;
}

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
  content: string,
) => {
  const stage = await DealStages.findOne({ _id: deal.stageId });
  if (!stage) {
    throw new Error('Stage not found');
  }
  const pipeline = await DealPipelines.findOne({ _id: stage.pipelineId });
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
    receivers: (deal.assignedUserIds || []).filter(id => id !== user._id),
  });
};

const dealMutations = {
  /**
   * Create new board
   */
  dealBoardsAdd(_root, doc: IBoard, { user }: { user: IUserDocument }) {
    return DealBoards.createBoard({ userId: user._id, ...doc });
  },

  /**
   * Edit board
   */
  dealBoardsEdit(_root, { _id, ...doc }: IDealBoardsEdit) {
    return DealBoards.updateBoard(_id, doc);
  },

  /**
   * Remove board
   */
  dealBoardsRemove(_root, { _id }: { _id: string }) {
    return DealBoards.removeBoard(_id);
  },

  /**
   * Create new pipeline
   */
  dealPipelinesAdd(_root, { stages, ...doc }: IDealPipelinesAdd, { user }: { user: IUserDocument }) {
    return DealPipelines.createPipeline({ userId: user._id, ...doc }, stages);
  },

  /**
   * Edit pipeline
   */
  dealPipelinesEdit(_root, { _id, stages, ...doc }: IDealPipelinesEdit) {
    return DealPipelines.updatePipeline(_id, doc, stages);
  },

  /**
   * Update pipeline orders
   */
  dealPipelinesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return DealPipelines.updateOrder(orders);
  },

  /**
   * Remove pipeline
   */
  dealPipelinesRemove(_root, { _id }: { _id: string }) {
    return DealPipelines.removePipeline(_id);
  },

  /**
   * Create new stage
   */
  dealStagesAdd(_root, doc: IStage, { user }: { user: IUserDocument }) {
    return DealStages.createStage({ userId: user._id, ...doc });
  },

  /**
   * Edit stage
   */
  dealStagesEdit(_root, { _id, ...doc }: IDealStagesEdit) {
    return DealStages.updateStage(_id, doc);
  },

  /**
   * Change stage
   */
  dealStagesChange(_root, { _id, pipelineId }: { _id: string; pipelineId: string }) {
    return DealStages.changeStage(_id, pipelineId);
  },

  /**
   * Update stage orders
   */
  dealStagesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return DealStages.updateOrder(orders);
  },

  /**
   * Remove stage
   */
  dealStagesRemove(_root, { _id }: { _id: string }) {
    return DealStages.removeStage(_id);
  },

  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    const deal = await Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });

    await sendDealNotifications(deal, user, NOTIFICATION_TYPES.DEAL_ADD, `A member invited you to the '${deal.name}'.`);
    return deal;
  },

  /**
   * Edit deal
   */
  async dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }) {
    const deal = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await sendDealNotifications(deal, user, NOTIFICATION_TYPES.DEAL_EDIT, `A user added you to the '${deal.name}'.`);
    return deal;
  },

  /**
   * Change deal
   */
  async dealsChange(_root, { _id, ...doc }: { _id: string }, { user }: { user: IUserDocument }) {
    const deal = await Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await sendDealNotifications(
      deal,
      user,
      NOTIFICATION_TYPES.DEAL_CHANGE,
      `Your '${deal.name}' deal has changed(moved).`,
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

    await sendDealNotifications(deal, user, NOTIFICATION_TYPES.DEAL_REMOVE, `A deleted deal: '${deal.name}'`);

    return Deals.removeDeal(_id);
  },
};

checkPermission(dealMutations, 'dealBoardsAdd', 'dealBoardsAdd');
checkPermission(dealMutations, 'dealBoardsEdit', 'dealBoardsEdit');
checkPermission(dealMutations, 'dealBoardsRemove', 'dealBoardsRemove');
checkPermission(dealMutations, 'dealPipelinesAdd', 'dealPipelinesAdd');
checkPermission(dealMutations, 'dealPipelinesEdit', 'dealPipelinesEdit');
checkPermission(dealMutations, 'dealPipelinesUpdateOrder', 'dealPipelinesUpdateOrder');
checkPermission(dealMutations, 'dealPipelinesRemove', 'dealPipelinesRemove');
checkPermission(dealMutations, 'dealStagesAdd', 'dealStagesAdd');
checkPermission(dealMutations, 'dealStagesChange', 'dealStagesChange');
checkPermission(dealMutations, 'dealStagesUpdateOrder', 'dealStagesUpdateOrder');
checkPermission(dealMutations, 'dealStagesRemove', 'dealStagesRemove');
checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
