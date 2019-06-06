import {
  companyFactory,
  customerFactory,
  dealBoardFactory,
  dealFactory,
  dealPipelineFactory,
  dealStageFactory,
  userFactory,
} from '../db/factories';
import { DealBoards, DealPipelines, Deals, DealStages } from '../db/models';
import { IBoardDocument, IDealDocument, IPipelineDocument, IStageDocument } from '../db/models/definitions/deals';
import { IUserDocument } from '../db/models/definitions/users';

import './setup.ts';

describe('Test deals model', () => {
  let board: IBoardDocument;
  let pipeline: IPipelineDocument;
  let stage: IStageDocument;
  let deal: IDealDocument;
  let user: IUserDocument;

  beforeEach(async () => {
    // Creating test data
    board = await dealBoardFactory();
    pipeline = await dealPipelineFactory({ boardId: board._id });
    stage = await dealStageFactory({ pipelineId: pipeline._id });
    deal = await dealFactory({ stageId: stage._id });
    user = await userFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await DealBoards.deleteMany({});
    await DealPipelines.deleteMany({});
    await DealStages.deleteMany({});
    await Deals.deleteMany({});
  });

  // Test deal board
  test('Create board', async () => {
    const createdBoard = await DealBoards.createBoard({
      name: board.name,
      userId: user._id,
    });

    expect(createdBoard).toBeDefined();
    expect(createdBoard.name).toEqual(board.name);
    expect(createdBoard.createdAt).toEqual(board.createdAt);
    expect(createdBoard.userId).toEqual(user._id);
  });

  test('Update board', async () => {
    const boardName = 'Update board name';
    const updatedBoard = await DealBoards.updateBoard(board._id, {
      name: boardName,
      userId: user._id,
    });

    expect(updatedBoard).toBeDefined();
    expect(updatedBoard.name).toEqual(boardName);
    expect(updatedBoard.userId).toEqual(user._id);
  });

  test('Remove board', async () => {
    const doc = { boardId: 'boardId' };

    await DealPipelines.updateMany({}, { $set: doc });

    const isDeleted = await DealBoards.removeBoard(board.id);

    expect(isDeleted).toBeTruthy();
  });

  test('Remove board not found', async () => {
    expect.assertions(1);

    const fakeBoardId = 'fakeBoardId';

    try {
      await DealBoards.removeBoard(fakeBoardId);
    } catch (e) {
      expect(e.message).toEqual('Board not found');
    }
  });

  test("Can't remove a board", async () => {
    expect.assertions(1);

    try {
      await DealBoards.removeBoard(board._id);
    } catch (e) {
      expect(e.message).toEqual("Can't remove a board");
    }
  });

  // Test deal pipeline
  test('Create pipeline', async () => {
    const createdPipeline = await DealPipelines.createPipeline(
      {
        name: pipeline.name,
        boardId: pipeline.boardId,
        userId: user._id,
      },
      [stage.toJSON()],
    );

    const stageToPipeline = await DealStages.findOne({ _id: stage._id });

    if (!stageToPipeline) {
      throw new Error('Stage not found');
    }

    expect(createdPipeline).toBeDefined();
    expect(createdPipeline._id).toEqual(stageToPipeline.pipelineId);
    expect(createdPipeline.name).toEqual(pipeline.name);
    expect(createdPipeline.boardId).toEqual(board._id);
    expect(createdPipeline.createdAt).toEqual(pipeline.createdAt);
    expect(createdPipeline.userId).toEqual(user._id);
  });

  test('Update pipeline', async () => {
    const pipelineName = 'Update pipeline name';
    const pipelineObj = await dealPipelineFactory({});
    const stageObj = await dealStageFactory({ pipelineId: pipelineObj._id });
    const testStage = await dealStageFactory({ pipelineId: pipelineObj._id });

    const updatedPipeline = await DealPipelines.updatePipeline(
      pipelineObj._id,
      {
        name: pipelineName,
        userId: user._id,
      },
      [stageObj],
    );

    const stages = await DealStages.find({ _id: testStage._id });

    expect(updatedPipeline).toBeDefined();
    expect(updatedPipeline.name).toEqual(pipelineName);
    expect(stages.length).toEqual(0);
  });

  test('Update pipeline orders', async () => {
    const pipelineToOrder = await dealPipelineFactory({});

    const [updatedPipeline, updatedPipelineToOrder] = await DealPipelines.updateOrder([
      { _id: pipeline._id, order: 5 },
      { _id: pipelineToOrder._id, order: 4 },
    ]);

    expect(updatedPipeline.order).toBe(4);
    expect(updatedPipelineToOrder.order).toBe(5);
  });

  test('Remove pipeline', async () => {
    const doc = { pipelineId: 'pipelineId' };

    await DealStages.updateMany({}, { $set: doc });

    const isDeleted = await DealPipelines.removePipeline(pipeline.id);
    expect(isDeleted).toBeTruthy();
  });

  test('Remove pipeline not found', async () => {
    expect.assertions(1);

    const fakePipelineId = 'fakePipelineId';

    try {
      await DealPipelines.removePipeline(fakePipelineId);
    } catch (e) {
      expect(e.message).toEqual('Pipeline not found');
    }
  });

  test("Can't remove a pipeline", async () => {
    expect.assertions(1);

    try {
      await DealPipelines.removePipeline(pipeline._id);
    } catch (e) {
      expect(e.message).toEqual("Can't remove a pipeline");
    }
  });

  // Test deal stage
  test('Create stage', async () => {
    const createdStage = await DealStages.createStage({
      name: stage.name,
      pipelineId: stage.pipelineId,
      userId: user._id,
    });

    expect(createdStage).toBeDefined();
    expect(createdStage.name).toEqual(stage.name);
    expect(createdStage.pipelineId).toEqual(pipeline._id);
    expect(createdStage.createdAt).toEqual(stage.createdAt);
    expect(createdStage.userId).toEqual(user._id);
  });

  test('Update stage', async () => {
    const stageName = 'Update stage name';
    const updatedStage = await DealStages.updateStage(stage._id, {
      name: stageName,
      userId: user._id,
    });

    expect(updatedStage).toBeDefined();
    expect(updatedStage.name).toEqual(stageName);
  });

  test('Change stage', async () => {
    const pipelineToUpdate = await dealPipelineFactory({});
    const changedStage = await DealStages.changeStage(stage._id, pipelineToUpdate._id);

    expect(changedStage).toBeDefined();
    expect(changedStage.pipelineId).toEqual(pipelineToUpdate._id);
  });

  test('Update stage orders', async () => {
    const stageToOrder = await dealStageFactory({});

    const [updatedStage, updatedStageToOrder] = await DealStages.updateOrder([
      { _id: stage._id, order: 9 },
      { _id: stageToOrder._id, order: 5 },
    ]);

    expect(updatedStage.order).toBe(5);
    expect(updatedStageToOrder.order).toBe(9);
  });

  test('Remove stage', async () => {
    await Deals.updateMany({}, { $set: { stageId: 'stageId' } });

    const isDeleted = await DealStages.removeStage(stage.id);

    expect(isDeleted).toBeTruthy();
  });

  test('Remove stage not found', async () => {
    expect.assertions(1);

    const fakeStageId = 'fakeStageId';

    try {
      await DealStages.removeStage(fakeStageId);
    } catch (e) {
      expect(e.message).toEqual('Stage not found');
    }
  });

  test("Can't remove a stage", async () => {
    expect.assertions(1);

    try {
      await DealStages.removeStage(stage._id);
    } catch (e) {
      expect(e.message).toEqual("Can't remove a stage");
    }
  });

  // Test deal
  test('Create deal', async () => {
    const createdDeal = await Deals.createDeal({
      stageId: deal.stageId,
      userId: user._id,
    });

    expect(createdDeal).toBeDefined();
    expect(createdDeal.stageId).toEqual(stage._id);
    expect(createdDeal.createdAt).toEqual(deal.createdAt);
    expect(createdDeal.userId).toEqual(user._id);
  });

  test('Update deal', async () => {
    const dealStageId = 'fakeId';
    const updatedDeal = await Deals.updateDeal(deal._id, {
      stageId: dealStageId,
    });

    expect(updatedDeal).toBeDefined();
    expect(updatedDeal.stageId).toEqual(dealStageId);
    expect(updatedDeal.closeDate).toEqual(deal.closeDate);
  });

  test('Update deal orders', async () => {
    const dealToOrder = await dealFactory({});

    const [updatedDeal, updatedDealToOrder] = await Deals.updateOrder(stage._id, [
      { _id: deal._id, order: 9 },
      { _id: dealToOrder._id, order: 3 },
    ]);

    expect(updatedDeal.stageId).toBe(stage._id);
    expect(updatedDeal.order).toBe(3);
    expect(updatedDealToOrder.order).toBe(9);
  });

  test('Remove deal', async () => {
    const isDeleted = await Deals.removeDeal(deal.id);

    expect(isDeleted).toBeTruthy();
  });

  test('Remove deal not found', async () => {
    expect.assertions(1);

    const fakeDealId = 'fakeDealId';

    try {
      await Deals.removeDeal(fakeDealId);
    } catch (e) {
      expect(e.message).toEqual('Deal not found');
    }
  });

  test('Deal change customer', async () => {
    const newCustomer = await customerFactory({});

    const customer1 = await customerFactory({});
    const customer2 = await customerFactory({});
    const dealObj = await dealFactory({
      customerIds: [customer2._id, customer1._id],
    });

    await Deals.changeCustomer(newCustomer._id, [customer2._id, customer1._id]);

    const result = await Deals.findOne({ _id: dealObj._id });

    if (!result) {
      throw new Error('Deal not found');
    }

    expect(result.customerIds).toContain(newCustomer._id);
    expect(result.customerIds).not.toContain(customer1._id);
    expect(result.customerIds).not.toContain(customer2._id);
  });

  test('Deal change company', async () => {
    const newCompany = await companyFactory({});

    const company1 = await companyFactory({});
    const company2 = await companyFactory({});
    const dealObj = await dealFactory({
      companyIds: [company1._id, company2._id],
    });

    await Deals.changeCompany(newCompany._id, [company1._id, company2._id]);

    const result = await Deals.findOne({ _id: dealObj._id });

    if (!result) {
      throw new Error('Deal not found');
    }

    expect(result.companyIds).toContain(newCompany._id);
    expect(result.companyIds).not.toContain(company1._id);
    expect(result.companyIds).not.toContain(company2._id);
  });
});
