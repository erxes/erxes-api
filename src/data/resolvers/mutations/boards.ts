import { Boards, Pipelines, Stages } from '../../../db/models';
import { IBoard, IOrderInput, IPipeline, IPipelineStage, IStageDocument } from '../../../db/models/definitions/boards';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
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
  async boardsAdd(_root, doc: IBoard, { user, docModifier }: IContext) {
    await checkPermission(doc.type, user, 'boardsAdd');

    const board = await Boards.createBoard(docModifier({ userId: user._id, ...doc }));

    await putCreateLog(
      {
        type: 'board',
        newData: JSON.stringify(doc),
        description: `${doc.name} has been created`,
        object: board,
      },
      user,
    );

    return board;
  },

  /**
   * Edit board
   */
  async boardsEdit(_root, { _id, ...doc }: IBoardsEdit, { user, docModifier }: IContext) {
    await checkPermission(doc.type, user, 'boardsEdit');

    const board = await Boards.findOne({ _id });
    const updated = await Boards.updateBoard(_id, docModifier(doc));

    if (board) {
      await putUpdateLog(
        {
          type: 'board',
          newData: JSON.stringify(doc),
          description: `${doc.name} has been edited`,
          object: board,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove board
   */
  async boardsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const board = await Boards.findOne({ _id });

    if (board) {
      await checkPermission(board.type, user, 'boardsRemove');
    }

    const removed = await Boards.removeBoard(_id);

    if (board && removed) {
      await putDeleteLog(
        {
          type: 'board',
          object: board,
          description: `${board.name} has been removed`,
        },
        user,
      );
    }
  },

  /**
   * Create new pipeline
   */
  async pipelinesAdd(_root, { stages, ...doc }: IPipelinesAdd, { user }: IContext) {
    await checkPermission(doc.type, user, 'pipelinesAdd');

    return Pipelines.createPipeline({ userId: user._id, ...doc }, stages);
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

    const pipeline = await Pipelines.findOne({ _id });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    return Pipelines.watchPipeline(_id, isAdd, user._id);
  },

  /**
   * Remove pipeline
   */
  async pipelinesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const pipeline = await Pipelines.findOne({ _id });

    if (pipeline) {
      await checkPermission(pipeline.type, user, 'pipelinesRemove');
    }

    return Pipelines.removePipeline(_id);
  },

  /**
   * Copy pipeline
   */
  async pipelinesCopy(_root, { _id, boardId, type }: { _id: string; boardId: string; type: string }) {
    const pipeline = await Pipelines.findOne({ _id });

    if (pipeline) {
      const stages = await Stages.find({ pipelineId: pipeline._id });

      const copiedPipeline = {
        name: `Copy of ${pipeline.name}`,
        boardId,
        type,
        visibility: pipeline.visibility,
        memberIds: pipeline.memberIds,
        bgColor: pipeline.bgColor,
      };

      const copiedStages: IPipelineStage[] = [];

      stages.forEach(stage => {
        const copied = {
          name: stage.name,
          formId: stage.formId,
          type,
          _id: Math.random().toString(),
        };

        copiedStages.push(copied);
      });

      return Pipelines.createPipeline(copiedPipeline, copiedStages);
    }

    return null;
  },

  /**
   * Update stage orders
   */
  stagesUpdateOrder(_root, { orders }: { orders: IOrderInput[] }) {
    return Stages.updateOrder(orders);
  },
};

export default boardMutations;
