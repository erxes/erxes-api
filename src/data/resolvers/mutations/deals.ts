import { IContext } from '../../../connectionResolver';
import { IOrderInput } from '../../../db/models/Deals';
import { IBoard, IDeal, IPipeline, IStage, IStageDocument } from '../../../db/models/definitions/deals';
import { moduleRequireLogin } from '../../permissions';

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
  dealBoardsAdd(_root, doc: IBoard, { user, models }: IContext) {
    const { DealBoards } = models;

    return DealBoards.createBoard({ userId: user._id, ...doc });
  },

  /**
   * Edit board
   */
  dealBoardsEdit(_root, { _id, ...doc }: IDealBoardsEdit, { models }: IContext) {
    const { DealBoards } = models;

    return DealBoards.updateBoard(_id, doc);
  },

  /**
   * Remove board
   */
  dealBoardsRemove(_root, { _id }: { _id: string }, { models }: IContext) {
    const { DealBoards } = models;

    return DealBoards.removeBoard(_id);
  },

  /**
   * Create new pipeline
   */
  dealPipelinesAdd(_root, { stages, ...doc }: IDealPipelinesAdd, { user, models }: IContext) {
    const { DealPipelines } = models;

    return DealPipelines.createPipeline({ userId: user._id, ...doc }, stages);
  },

  /**
   * Edit pipeline
   */
  dealPipelinesEdit(_root, { _id, stages, ...doc }: IDealPipelinesEdit, { models }: IContext) {
    const { DealPipelines } = models;

    return DealPipelines.updatePipeline(_id, doc, stages);
  },

  /**
   * Update pipeline orders
   */
  dealPipelinesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }, { models }: IContext) {
    const { DealPipelines } = models;

    return DealPipelines.updateOrder(orders);
  },

  /**
   * Remove pipeline
   */
  dealPipelinesRemove(_root, { _id }: { _id: string }, { models }: IContext) {
    const { DealPipelines } = models;

    return DealPipelines.removePipeline(_id);
  },

  /**
   * Create new stage
   */
  dealStagesAdd(_root, doc: IStage, { user, models }: IContext) {
    const { DealStages } = models;

    return DealStages.createStage({ userId: user._id, ...doc });
  },

  /**
   * Edit stage
   */
  dealStagesEdit(_root, { _id, ...doc }: IDealStagesEdit, { models }: IContext) {
    const { DealStages } = models;

    return DealStages.updateStage(_id, doc);
  },

  /**
   * Change stage
   */
  dealStagesChange(_root, { _id, pipelineId }: { _id: string; pipelineId: string }, { models }: IContext) {
    const { DealStages } = models;

    return DealStages.changeStage(_id, pipelineId);
  },

  /**
   * Update stage orders
   */
  dealStagesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }, { models }: IContext) {
    const { DealStages } = models;

    return DealStages.updateOrder(orders);
  },

  /**
   * Remove stage
   */
  dealStagesRemove(_root, { _id }: { _id: string }, { models }: IContext) {
    const { DealStages } = models;

    return DealStages.removeStage(_id);
  },

  /**
   * Create new deal
   */
  async dealsAdd(_root, doc: IDeal, { user, models }: IContext) {
    const { Deals, ActivityLogs } = models;

    const deal = await Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });

    await ActivityLogs.createDealRegistrationLog(deal, user);

    return deal;
  },

  /**
   * Edit deal
   */
  dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user, models }: IContext) {
    const { Deals } = models;

    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Change deal
   */
  dealsChange(_root, { _id, ...doc }: { _id: string; stageId: string }, { user, models }: IContext) {
    const { Deals } = models;

    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Update deal orders
   */
  dealsUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }, { models }: IContext) {
    const { Deals } = models;

    return Deals.updateOrder(stageId, orders);
  },

  /**
   * Remove deal
   */
  dealsRemove(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Deals } = models;

    return Deals.removeDeal(_id);
  },
};

moduleRequireLogin(dealMutations);

export default dealMutations;
