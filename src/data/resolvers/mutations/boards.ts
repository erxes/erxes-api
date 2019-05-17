import { Boards, Pipelines, Stages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/deals';
import { IBoard, IPipeline, IStage, IStageDocument } from '../../../db/models/definitions/boards';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions';

interface IBoardsEdit extends IBoard {
  _id: string;
}

interface IPipelinesAdd extends IPipeline {
  stages: IStageDocument[];
}

interface IPipelinesEdit extends IPipelinesAdd {
  _id: string;
}

interface IStagesEdit extends IStage {
  _id: string;
}

const boardMutations = {
  /**
   * Create new board
   */
  boardsAdd(_root, doc: IBoard, { user }: { user: IUserDocument }) {
    return Boards.createBoard({ userId: user._id, ...doc });
  },

  /**
   * Edit board
   */
  boardsEdit(_root, { _id, ...doc }: IBoardsEdit) {
    return Boards.updateBoard(_id, doc);
  },

  /**
   * Remove board
   */
  boardsRemove(_root, { _id }: { _id: string }) {
    return Boards.removeBoard(_id);
  },

  /**
   * Create new pipeline
   */
  pipelinesAdd(_root, { stages, ...doc }: IPipelinesAdd, { user }: { user: IUserDocument }) {
    return Pipelines.createPipeline({ userId: user._id, ...doc }, stages);
  },

  /**
   * Edit pipeline
   */
  pipelinesEdit(_root, { _id, stages, ...doc }: IPipelinesEdit) {
    return Pipelines.updatePipeline(_id, doc, stages);
  },

  /**
   * Update pipeline orders
   */
  pipelinesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return Pipelines.updateOrder(orders);
  },

  /**
   * Remove pipeline
   */
  pipelinesRemove(_root, { _id }: { _id: string }) {
    return Pipelines.removePipeline(_id);
  },

  /**
   * Create new stage
   */
  stagesAdd(_root, doc: IStage, { user }: { user: IUserDocument }) {
    return Stages.createStage({ userId: user._id, ...doc });
  },

  /**
   * Edit stage
   */
  stagesEdit(_root, { _id, ...doc }: IStagesEdit) {
    return Stages.updateStage(_id, doc);
  },

  /**
   * Change stage
   */
  stagesChange(_root, { _id, pipelineId }: { _id: string; pipelineId: string }) {
    return Stages.changeStage(_id, pipelineId);
  },

  /**
   * Update stage orders
   */
  stagesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return Stages.updateOrder(orders);
  },

  /**
   * Remove stage
   */
  stagesRemove(_root, { _id }: { _id: string }) {
    return Stages.removeStage(_id);
  },
};

checkPermission(boardMutations, 'boardsAdd', 'boardsAdd');
checkPermission(boardMutations, 'boardsEdit', 'boardsEdit');
checkPermission(boardMutations, 'boardsRemove', 'boardsRemove');
checkPermission(boardMutations, 'pipelinesAdd', 'pipelinesAdd');
checkPermission(boardMutations, 'pipelinesEdit', 'pipelinesEdit');
checkPermission(boardMutations, 'pipelinesUpdateOrder', 'pipelinesUpdateOrder');
checkPermission(boardMutations, 'pipelinesRemove', 'pipelinesRemove');
checkPermission(boardMutations, 'stagesAdd', 'stagesAdd');
checkPermission(boardMutations, 'stagesChange', 'stagesChange');
checkPermission(boardMutations, 'stagesUpdateOrder', 'stagesUpdateOrder');
checkPermission(boardMutations, 'stagesRemove', 'stagesRemove');

export default boardMutations;
