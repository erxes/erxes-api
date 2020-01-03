import { Boards, Pipelines, Stages } from '../../../db/models';
import { IBoard, IOrderInput, IPipeline, IStageDocument } from '../../../db/models/definitions/boards';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { checkPermission } from '../boardUtils';
import { gatherNames, gatherUsernames, LogDesc } from './logUtils';

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
  async boardsAdd(_root, doc: IBoard, { user, docModifier }: IContext) {
    await checkPermission(doc.type, user, 'boardsAdd');

    const extendedDoc = docModifier({ userId: user._id, ...doc });

    const board = await Boards.createBoard(extendedDoc);

    await putCreateLog(
      {
        type: `${doc.type}Boards`,
        newData: JSON.stringify(extendedDoc),
        description: `"${extendedDoc.name}" has been created`,
        object: board,
        extraDesc: JSON.stringify([{ userId: user._id, name: user.username || user.email }]),
      },
      user,
    );

    return board;
  },

  /**
   * Edit board
   */
  async boardsEdit(_root, { _id, ...doc }: IBoardsEdit, { user }: IContext) {
    await checkPermission(doc.type, user, 'boardsEdit');

    const board = await Boards.getBoard(_id);
    const updated = await Boards.updateBoard(_id, doc);

    const extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [board.userId || ''],
      foreignKey: 'userId',
    });

    await putUpdateLog(
      {
        type: `${doc.type}Boards`,
        newData: JSON.stringify(doc),
        description: `"${doc.name}" has been edited`,
        object: board,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Remove board
   */
  async boardsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const board = await Boards.getBoard(_id);

    await checkPermission(board.type, user, 'boardsRemove');

    const removed = await Boards.removeBoard(_id);

    let extraDesc: LogDesc[] = [];

    if (board.userId) {
      extraDesc = await gatherUsernames({
        idFields: [board.userId],
        foreignKey: 'userId',
      });
    }

    await putDeleteLog(
      {
        type: `${board.type}Boards`,
        object: board,
        description: `"${board.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },

  /**
   * Create new pipeline
   */
  async pipelinesAdd(_root, { stages, ...doc }: IPipelinesAdd, { user }: IContext) {
    await checkPermission(doc.type, user, 'pipelinesAdd');

    const pipeline = await Pipelines.createPipeline({ userId: user._id, ...doc }, stages);

    let extraDesc: LogDesc[] = [{ userId: user._id, name: user.username || user.email }];

    extraDesc = await gatherNames({
      collection: Boards,
      idFields: [doc.boardId],
      foreignKey: 'boardId',
      nameFields: ['name'],
      prevList: extraDesc,
    });

    if (doc.excludeCheckUserIds && doc.excludeCheckUserIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: doc.excludeCheckUserIds,
        foreignKey: 'excludeCheckUserIds',
        prevList: extraDesc,
      });
    }

    if (doc.memberIds && doc.memberIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: doc.memberIds,
        foreignKey: 'memberIds',
        prevList: extraDesc,
      });
    }

    await putCreateLog(
      {
        type: `${doc.type}Pipelines`,
        newData: JSON.stringify(doc),
        description: `"${doc.name}" has been created`,
        object: pipeline,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return pipeline;
  },

  /**
   * Edit pipeline
   */
  async pipelinesEdit(_root, { _id, stages, ...doc }: IPipelinesEdit, { user }: IContext) {
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
   * Watch pipeline
   */
  async pipelinesWatch(_root, { _id, isAdd, type }: { _id: string; isAdd: boolean; type: string }, { user }: IContext) {
    await checkPermission(type, user, 'pipelinesWatch');

    return Pipelines.watchPipeline(_id, isAdd, user._id);
  },

  /**
   * Remove pipeline
   */
  async pipelinesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const pipeline = await Pipelines.getPipeline(_id);

    await checkPermission(pipeline.type, user, 'pipelinesRemove');

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
