import { Boards, Pipelines, Stages } from '../../../db/models';
import { IBoard, IOrderInput, IPipeline, IStageDocument } from '../../../db/models/definitions/boards';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { putLog } from '../../utils';
import { checkPermission } from '../boardUtils';

interface IBoardsEdit extends IBoard {
  _id: string;
}

interface IPipelinesAdd extends IPipeline {
  stages: IStageDocument[];
}

interface IPipelinesEdit extends IPipelinesAdd {
  _id: string;
}

const boardMutations = {
  /**
   * Create new board
   */
  async boardsAdd(_root, doc: IBoard, { user }: { user: IUserDocument }) {
    await checkPermission(doc.type, user, 'boardsAdd');
    const board = await Boards.createBoard({ userId: user._id, ...doc });

    await putLog({
      createdBy: user._id,
      type: 'board',
      action: LOG_ACTIONS.CREATE,
      newData: JSON.stringify(doc),
      objectId: board._id,
      unicode: user.username || user.email || user._id,
      description: `${doc.name} has been created`,
    });

    return board;
  },

  /**
   * Edit board
   */
  async boardsEdit(_root, { _id, ...doc }: IBoardsEdit, { user }: { user: IUserDocument }) {
    await checkPermission(doc.type, user, 'boardsEdit');
    const updated = await Boards.updateBoard(_id, doc);

    if (updated && updated._id) {
      await putLog({
        createdBy: user._id,
        type: 'board',
        action: LOG_ACTIONS.UPDATE,
        newData: JSON.stringify(doc),
        objectId: updated._id,
        unicode: user.username || user.email || user._id,
        description: `${doc.name} has been edited`,
      });
    }

    return updated;
  },

  /**
   * Remove board
   */
  async boardsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const board = await Boards.findOne({ _id });

    if (board) {
      await checkPermission(board.type, user, 'boardsRemove');
    }

    const removed = await Boards.removeBoard(_id);

    if (board && removed) {
      await putLog({
        createdBy: user._id,
        type: 'board',
        action: LOG_ACTIONS.DELETE,
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${board.name} has been removed`,
      });
    }
  },

  /**
   * Create new pipeline
   */
  async pipelinesAdd(_root, { stages, ...doc }: IPipelinesAdd, { user }: { user: IUserDocument }) {
    await checkPermission(doc.type, user, 'pipelinesAdd');

    return Pipelines.createPipeline({ userId: user._id, ...doc }, stages);
  },

  /**
   * Edit pipeline
   */
  async pipelinesEdit(_root, { _id, stages, ...doc }: IPipelinesEdit, { user }: { user: IUserDocument }) {
    await checkPermission(doc.type, user, 'pipelinesEdit');

    return Pipelines.updatePipeline(_id, doc, stages);
  },

  /**
   * Update pipeline orders
   */
  async pipelinesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return Pipelines.updateOrder(orders);
  },

  /**
   * Remove pipeline
   */
  async pipelinesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const pipeline = await Pipelines.findOne({ _id });

    if (pipeline) {
      await checkPermission(pipeline.type, user, 'pipelinesRemove');
    }

    return Pipelines.removePipeline(_id);
  },

  /**
   * Update stage orders
   */
  stagesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return Stages.updateOrder(orders);
  },
};

export default boardMutations;
