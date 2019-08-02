import {
  boardFactory,
  companyFactory,
  customerFactory,
  growthHackFactory,
  pipelineFactory,
  stageFactory,
  userFactory,
} from '../db/factories';
import { Boards, GrowthHacks, Pipelines, Stages } from '../db/models';
import { IBoardDocument, IPipelineDocument, IStageDocument } from '../db/models/definitions/boards';
import { IGrowthHackDocument } from '../db/models/definitions/growthHacks';
import { IUserDocument } from '../db/models/definitions/users';

import { BOARD_TYPES } from '../db/models/definitions/constants';
import './setup.ts';

describe('Test growthHacks model', () => {
  let board: IBoardDocument;
  let pipeline: IPipelineDocument;
  let stage: IStageDocument;
  let growthHack: IGrowthHackDocument;
  let user: IUserDocument;

  beforeEach(async () => {
    // Creating test data
    board = await boardFactory({ type: BOARD_TYPES.GROWTH_HACK });
    pipeline = await pipelineFactory({ boardId: board._id });
    stage = await stageFactory({ pipelineId: pipeline._id });
    growthHack = await growthHackFactory({ stageId: stage._id });
    user = await userFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await Boards.deleteMany({});
    await Pipelines.deleteMany({});
    await Stages.deleteMany({});
    await GrowthHacks.deleteMany({});
  });

  // Test growthHack
  test('Create growthHack', async () => {
    const createdGrowthHack = await GrowthHacks.createGrowthHack({
      stageId: growthHack.stageId,
      userId: user._id,
    });

    expect(createdGrowthHack).toBeDefined();
    expect(createdGrowthHack.stageId).toEqual(stage._id);
    expect(createdGrowthHack.createdAt).toEqual(growthHack.createdAt);
    expect(createdGrowthHack.userId).toEqual(user._id);
  });

  test('Update growthHack', async () => {
    const growthHackStageId = 'fakeId';
    const updatedGrowthHack = await GrowthHacks.updateGrowthHack(growthHack._id, {
      stageId: growthHackStageId,
    });

    expect(updatedGrowthHack).toBeDefined();
    expect(updatedGrowthHack.stageId).toEqual(growthHackStageId);
    expect(updatedGrowthHack.closeDate).toEqual(growthHack.closeDate);
  });

  test('Update growthHack orders', async () => {
    const growthHackToOrder = await growthHackFactory({});

    const [updatedGrowthHack, updatedGrowthHackToOrder] = await GrowthHacks.updateOrder(stage._id, [
      { _id: growthHack._id, order: 9 },
      { _id: growthHackToOrder._id, order: 3 },
    ]);

    expect(updatedGrowthHack.stageId).toBe(stage._id);
    expect(updatedGrowthHack.order).toBe(3);
    expect(updatedGrowthHackToOrder.order).toBe(9);
  });

  test('GrowthHack change customer', async () => {
    const newCustomer = await customerFactory({});

    const customer1 = await customerFactory({});
    const customer2 = await customerFactory({});
    const growthHackObj = await growthHackFactory({
      customerIds: [customer2._id, customer1._id],
    });

    await GrowthHacks.changeCustomer(newCustomer._id, [customer2._id, customer1._id]);

    const result = await GrowthHacks.findOne({ _id: growthHackObj._id });

    if (!result) {
      throw new Error('Growth hack not found');
    }

    expect(result.customerIds).toContain(newCustomer._id);
    expect(result.customerIds).not.toContain(customer1._id);
    expect(result.customerIds).not.toContain(customer2._id);
  });

  test('GrowthHack change company', async () => {
    const newCompany = await companyFactory({});

    const company1 = await companyFactory({});
    const company2 = await companyFactory({});
    const growthHackObj = await growthHackFactory({
      companyIds: [company1._id, company2._id],
    });

    await GrowthHacks.changeCompany(newCompany._id, [company1._id, company2._id]);

    const result = await GrowthHacks.findOne({ _id: growthHackObj._id });

    if (!result) {
      throw new Error('Growth hack not found');
    }

    expect(result.companyIds).toContain(newCompany._id);
    expect(result.companyIds).not.toContain(company1._id);
    expect(result.companyIds).not.toContain(company2._id);
  });
});
