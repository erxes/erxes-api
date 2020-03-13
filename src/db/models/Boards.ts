import { Model, model } from 'mongoose';
import { Forms } from './';
import { getCollection, updateOrder, watchItem } from './boardUtils';
import {
  boardSchema,
  IBoard,
  IBoardDocument,
  ICopyMoveParams,
  IPipeline,
  IPipelineDocument,
  IStage,
  IStageDocument,
  pipelineSchema,
  stageSchema,
} from './definitions/boards';
import { PROBABILITY } from './definitions/constants';
import { IDealDocument } from './definitions/deals';
import { IGrowthHackDocument } from './definitions/growthHacks';
import { ITaskDocument } from './definitions/tasks';
import { ITicketDocument } from './definitions/tickets';
import { getDuplicatedStages } from './PipelineTemplates';

export interface IOrderInput {
  _id: string;
  order: number;
}

// Not mongoose document, just stage shaped plain object
type IPipelineStage = IStage & { _id: string };

const hasItem = async (type: string, pipelineId: string, prevItemIds: string[] = []) => {
  const stages = await Stages.find({ pipelineId, _id: { $nin: prevItemIds } });

  const collection = getCollection(type);

  for (const stage of stages) {
    const itemCount = await collection.find({ stageId: stage._id }).countDocuments();

    if (itemCount > 0) {
      throw new Error('There is a stage that has a item');
    }
  }
};

const createOrUpdatePipelineStages = async (stages: IPipelineStage[], pipelineId: string, type: string) => {
  let order = 0;

  const validStageIds: string[] = [];
  const bulkOpsPrevEntry: Array<{
    updateOne: {
      filter: { _id: string };
      update: { $set: IStage };
    };
  }> = [];
  const prevItemIds = stages.map(stage => stage._id);
  // fetch stage from database
  const prevEntries = await Stages.find({ _id: { $in: prevItemIds } });
  const prevEntriesIds = prevEntries.map(entry => entry._id);

  await hasItem(type, pipelineId, prevItemIds);

  for (const stage of stages) {
    order++;

    const doc = { ...stage, order, pipelineId };

    const _id = doc._id;

    const prevEntry = prevEntriesIds.includes(_id);

    // edit
    if (prevEntry) {
      validStageIds.push(_id);

      bulkOpsPrevEntry.push({
        updateOne: {
          filter: {
            _id,
          },
          update: {
            $set: doc,
          },
        },
      });
      // create
    } else {
      delete doc._id;
      const createdStage = await Stages.createStage(doc);
      validStageIds.push(createdStage._id);
    }
  }

  if (bulkOpsPrevEntry.length > 0) {
    await Stages.bulkWrite(bulkOpsPrevEntry);
  }

  return Stages.deleteMany({ pipelineId, _id: { $nin: validStageIds } });
};

export interface IBoardModel extends Model<IBoardDocument> {
  getBoard(_id: string): Promise<IBoardDocument>;
  createBoard(doc: IBoard): Promise<IBoardDocument>;
  updateBoard(_id: string, doc: IBoard): Promise<IBoardDocument>;
  removeBoard(_id: string): object;
}

export const loadBoardClass = () => {
  class Board {
    /*
     * Get a Board
     */
    public static async getBoard(_id: string) {
      const board = await Boards.findOne({ _id });

      if (!board) {
        throw new Error('Board not found');
      }

      return board;
    }

    /**
     * Create a board
     */
    public static async createBoard(doc: IBoard) {
      return Boards.create(doc);
    }

    /**
     * Update Board
     */
    public static async updateBoard(_id: string, doc: IBoard) {
      await Boards.updateOne({ _id }, { $set: doc });

      return Boards.findOne({ _id });
    }

    /**
     * Remove Board
     */
    public static async removeBoard(_id: string) {
      const board = await Boards.findOne({ _id });

      if (!board) {
        throw new Error('Board not found');
      }

      const pipelines = await Pipelines.find({ boardId: _id });

      for (const pipeline of pipelines) {
        await hasItem(pipeline.type, pipeline._id);
      }

      for (const pipeline of pipelines) {
        await Pipelines.removePipeline(pipeline._id, true);
      }

      return Boards.deleteOne({ _id });
    }
  }

  boardSchema.loadClass(Board);

  return boardSchema;
};

export interface IPipelineModel extends Model<IPipelineDocument> {
  getPipeline(_id: string): Promise<IPipelineDocument>;
  createPipeline(doc: IPipeline, stages?: IPipelineStage[]): Promise<IPipelineDocument>;
  updatePipeline(_id: string, doc: IPipeline, stages?: IPipelineStage[]): Promise<IPipelineDocument>;
  updateOrder(orders: IOrderInput[]): Promise<IPipelineDocument[]>;
  watchPipeline(_id: string, isAdd: boolean, userId: string): void;
  removePipeline(_id: string, checked?: boolean): object;
}

export const loadPipelineClass = () => {
  class Pipeline {
    /*
     * Get a pipeline
     */
    public static async getPipeline(_id: string) {
      const pipeline = await Pipelines.findOne({ _id });

      if (!pipeline) {
        throw new Error('Pipeline not found');
      }

      return pipeline;
    }

    /**
     * Create a pipeline
     */
    public static async createPipeline(doc: IPipeline, stages?: IPipelineStage[]) {
      const pipeline = await Pipelines.create(doc);

      if (doc.templateId) {
        const duplicatedStages = await getDuplicatedStages({
          templateId: doc.templateId,
          pipelineId: pipeline._id,
          type: doc.type,
        });

        await createOrUpdatePipelineStages(duplicatedStages, pipeline._id, pipeline.type);
      } else if (stages) {
        await createOrUpdatePipelineStages(stages, pipeline._id, pipeline.type);
      }

      return pipeline;
    }

    /**
     * Update a pipeline
     */
    public static async updatePipeline(_id: string, doc: IPipeline, stages?: IPipelineStage[]) {
      if (doc.templateId) {
        const pipeline = await Pipelines.getPipeline(_id);

        if (doc.templateId !== pipeline.templateId) {
          const duplicatedStages = await getDuplicatedStages({
            templateId: doc.templateId,
            pipelineId: _id,
            type: doc.type,
          });

          await createOrUpdatePipelineStages(duplicatedStages, _id, doc.type);
        }
      } else if (stages) {
        await createOrUpdatePipelineStages(stages, _id, doc.type);
      }

      await Pipelines.updateOne({ _id }, { $set: doc });

      return Pipelines.findOne({ _id });
    }

    /*
     * Update given pipelines orders
     */
    public static async updateOrder(orders: IOrderInput[]) {
      return updateOrder(Pipelines, orders);
    }

    /**
     * Remove a pipeline
     */
    public static async removePipeline(_id: string, checked?: boolean) {
      const pipeline = await Pipelines.getPipeline(_id);

      if (!checked) {
        await hasItem(pipeline.type, pipeline._id);
      }

      const stages = await Stages.find({ pipelineId: pipeline._id });

      for (const stage of stages) {
        await Stages.removeStage(stage._id);
      }

      return Pipelines.deleteOne({ _id });
    }

    public static watchPipeline(_id: string, isAdd: boolean, userId: string) {
      return watchItem(Pipelines, _id, isAdd, userId);
    }
  }

  pipelineSchema.loadClass(Pipeline);

  return pipelineSchema;
};

type Cards = IDealDocument[] | ITaskDocument[] | ITicketDocument[] | IGrowthHackDocument[];

export interface IStageModel extends Model<IStageDocument> {
  getStage(_id: string): Promise<IStageDocument>;
  createStage(doc: IStage): Promise<IStageDocument>;
  removeStage(_id: string): object;
  updateStage(_id: string, doc: IStage): Promise<IStageDocument>;
  updateOrder(orders: IOrderInput[]): Promise<IStageDocument[]>;
  getCards(_id: string): Promise<Cards>;
  cloneCards(_id: string, destStageId: string, userId: string): Promise<Cards>;
  copyStage(params: ICopyMoveParams): Promise<IStageDocument>;
  moveStage(params: ICopyMoveParams): Promise<IStageDocument>;
}

export const loadStageClass = () => {
  class Stage {
    /*
     * Get a stage
     */
    public static async getStage(_id: string) {
      const stage = await Stages.findOne({ _id });

      if (!stage) {
        throw new Error('Stage not found');
      }

      return stage;
    }

    /**
     * Create a stage
     */
    public static createStage(doc: IStage) {
      return Stages.create(doc);
    }

    /**
     * Update Stage
     */
    public static async updateStage(_id: string, doc: IStage) {
      await Stages.updateOne({ _id }, { $set: doc });

      return Stages.findOne({ _id });
    }

    /*
     * Update given stages orders
     */
    public static async updateOrder(orders: IOrderInput[]) {
      return updateOrder(Stages, orders);
    }

    public static async getCards(_id: string) {
      const stage: IStageDocument = await Stages.getStage(_id);

      const collection = getCollection(stage.type);

      return collection.find({ stageId: stage._id }).lean();
    }

    public static async cloneCards(_id: string, destStageId: string, userId: string) {
      const stage = await Stages.getStage(_id);
      const cards = await Stages.getCards(stage._id);
      const collection = getCollection(stage.type);

      for (const card of cards) {
        const itemDoc = {
          name: `${card.name}-copied`,
          stageId: destStageId,
          initialStageId: destStageId,
          createdAt: new Date(),
          assignedUserIds: card.assignedUserIds,
          watchedUserIds: card.watchedUserIds,
          labelIds: card.labelIds,
          priority: card.priority,
          userId,
          description: card.description,
          status: card.status,
        };

        await collection.create(itemDoc);
      }

      return collection.find({ stageId: destStageId });
    }

    public static async copyStage(params: ICopyMoveParams) {
      const { stageId, pipelineId, includeCards, userId } = params;

      const destinationPipeline = await Pipelines.getPipeline(pipelineId);
      const stage = await Stages.getStage(stageId);

      const copiedStage = await Stages.createStage({
        pipelineId: destinationPipeline._id,
        createdAt: new Date(),
        name: `${stage.name}-copied`,
        userId,
        type: stage.type,
        formId: stage.formId,
        probability: stage.probability || PROBABILITY.TEN,
        status: stage.status,
      });

      if (includeCards === true) {
        await Stages.cloneCards(stage._id, copiedStage._id, userId);
      }

      return copiedStage;
    }

    /**
     * Moves a stage to given pipeline
     */
    public static async moveStage(params: ICopyMoveParams) {
      const { stageId, pipelineId } = params;

      const pipeline = await Pipelines.getPipeline(pipelineId);

      await Stages.updateOne({ _id: stageId }, { $set: { pipelineId: pipeline._id } });

      return Stages.findOne({ _id: stageId });
    }

    public static async removeStage(_id: string) {
      const stage = await Stages.getStage(_id);
      const pipeline = await Pipelines.getPipeline(stage.pipelineId);

      await hasItem(pipeline.type, pipeline._id);

      if (stage.formId) {
        await Forms.removeForm(stage.formId);
      }

      return Stages.deleteOne({ _id });
    }
  }

  stageSchema.loadClass(Stage);

  return stageSchema;
};

loadBoardClass();
loadPipelineClass();
loadStageClass();

// tslint:disable-next-line
const Boards = model<IBoardDocument, IBoardModel>('boards', boardSchema);

// tslint:disable-next-line
const Pipelines = model<IPipelineDocument, IPipelineModel>('pipelines', pipelineSchema);

// tslint:disable-next-line
const Stages = model<IStageDocument, IStageModel>('stages', stageSchema);

export { Boards, Pipelines, Stages };
