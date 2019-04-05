import { DealBoards, DealPipelines, Deals, DealStages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/Deals';
import { IBoard, IDeal, IPipeline, IStage, IStageDocument } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions';

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
  dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    return Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });
  },

  /**
   * Edit deal
   */
  dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }) {
    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Change deal
   */
  dealsChange(_root, { _id, ...doc }: { _id: string; stageId: string }, { user }: { user: IUserDocument }) {
    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Update deal orders
   */
  dealsUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return Deals.updateOrder(stageId, orders);
  },

  /**
   * Remove deal
   */
  dealsRemove(_root, { _id }: { _id: string }) {
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
checkPermission(dealMutations, 'dealsChange', 'dealsChange');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
