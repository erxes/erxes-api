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

checkPermission(boardMutations, 'boardsAdd', 'dealBoardsAdd');
checkPermission(boardMutations, 'boardsEdit', 'dealBoardsEdit');
checkPermission(boardMutations, 'boardsRemove', 'dealBoardsRemove');
checkPermission(boardMutations, 'pipelinesAdd', 'dealPipelinesAdd');
checkPermission(boardMutations, 'pipelinesEdit', 'dealPipelinesEdit');
checkPermission(boardMutations, 'pipelinesUpdateOrder', 'dealPipelinesUpdateOrder');
checkPermission(boardMutations, 'pipelinesRemove', 'dealPipelinesRemove');
checkPermission(boardMutations, 'stagesAdd', 'dealStagesAdd');
checkPermission(boardMutations, 'stagesUpdateOrder', 'dealStagesUpdateOrder');
checkPermission(boardMutations, 'stagesRemove', 'dealStagesRemove');

export default boardMutations;
