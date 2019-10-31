import { graphqlRequest } from '../db/connection';
import { boardFactory, pipelineFactory, stageFactory } from '../db/factories';
import { Boards, Pipelines, Stages } from '../db/models';

import { BOARD_TYPES, PROBABILITY } from '../db/models/definitions/constants';
import './setup.ts';

describe('boardQueries', () => {
  const commonBoardTypes = `
    _id
    name
    type
  `;

  const commonPipelineTypes = `
    _id
    name
    type
  `;

  const commonStageTypes = `
    _id
    name
    type
  `;

  afterEach(async () => {
    // Clearing test data
    await Boards.deleteMany({});
    await Stages.deleteMany({});
    await Pipelines.deleteMany({});
  });

  test('Boards', async () => {
    await boardFactory();
    await boardFactory();
    await boardFactory();

    const qry = `
      query boards($type: String!) {
        boards(type: $type) {
          ${commonBoardTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'boards', { type: 'deal' });

    expect(response.length).toBe(3);
  });

  test('Board detail', async () => {
    const board = await boardFactory();

    const args = { _id: board._id };

    const qry = `
      query boardDetail($_id: String!) {
        boardDetail(_id: $_id) {
          ${commonBoardTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'boardDetail', args);

    expect(response._id).toBe(board._id);
  });

  test('Board get last', async () => {
    const board = await boardFactory({ type: BOARD_TYPES.DEAL });

    const qry = `
      query boardGetLast($type: String!) {
        boardGetLast(type: $type) {
          ${commonBoardTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'boardGetLast', { type: 'deal' });

    expect(board._id).toBe(response._id);
  });

  test('Pipelines', async () => {
    const board = await boardFactory();

    const args = { boardId: board._id };

    await pipelineFactory(args);
    await pipelineFactory(args);
    await pipelineFactory(args);

    const qry = `
      query pipelines($boardId: String!) {
        pipelines(boardId: $boardId) {
          ${commonPipelineTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'pipelines', args);

    expect(response.length).toBe(3);
  });

  test('Stages', async () => {
    const pipeline = await pipelineFactory();

    const args = { pipelineId: pipeline._id, probability: PROBABILITY.LOST };

    await stageFactory(args);
    await stageFactory(args);
    await stageFactory(args);

    const qry = `
      query stages($pipelineId: String!, $isNotLost: Boolean) {
        stages(pipelineId: $pipelineId, isNotLost: $isNotLost) {
          ${commonStageTypes}
        }
      }
    `;

    const filter = { pipelineId: pipeline._id, isNotLost: false };

    let response = await graphqlRequest(qry, 'stages', filter);

    expect(response.length).toBe(3);

    args.probability = PROBABILITY.WON;

    await stageFactory(args);
    await stageFactory(args);

    filter.isNotLost = true;
    response = await graphqlRequest(qry, 'stages', filter);

    expect(response.length).toBe(2);
  });

  test('Stage detail', async () => {
    const stage = await stageFactory();

    const args = { _id: stage._id };

    const qry = `
      query stageDetail($_id: String!) {
        stageDetail(_id: $_id) {
          ${commonStageTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'stageDetail', args);

    expect(response._id).toBe(stage._id);
  });
});
