import * as moment from 'moment';
import { graphqlRequest } from '../db/connection';
import {
  boardFactory,
  fieldFactory,
  formFactory,
  formSubmissionFactory,
  growthHackFactory,
  pipelineFactory,
  stageFactory,
  userFactory,
} from '../db/factories';
import { GrowthHacks } from '../db/models';

import './setup.ts';

describe('growthHackQueries', () => {
  let board;
  let pipeline;
  let stage;

  const commonGrowthHackTypes = `
    _id
    name
    stageId
    assignedUserIds
    closeDate
    description
    pipeline { _id }
    assignedUsers { _id }
    impact
    labels { _id }
    assignedUsers { _id }
    votedUsers { _id }
    stage { _id }
    isVoted
    boardId
    formId
    scoringType
    isWatched
    formSubmissions
    formFields { _id }
  `;

  const qryGrowthHackFilter = `
    query growthHacks(
      $stageId: String 
      $assignedUserIds: [String]
      $nextDay: String
      $nextWeek: String
      $nextMonth: String
      $noCloseDate: String
      $overdue: String
      $priority: String
      $hackStage: String
    ) {
      growthHacks(
        stageId: $stageId 
        assignedUserIds: $assignedUserIds
        nextDay: $nextDay
        nextWeek: $nextWeek
        nextMonth: $nextMonth
        noCloseDate: $noCloseDate
        overdue: $overdue
        priority: $priority
        hackStage: $hackStage
      ) {
        ${commonGrowthHackTypes}
      }
    }
  `;

  beforeEach(async () => {
    // Creating test data
    board = await boardFactory();
    pipeline = await pipelineFactory({ boardId: board._id, hackScoringType: 'ice' });
    stage = await stageFactory({ pipelineId: pipeline._id });
  });

  afterEach(async () => {
    // Clearing test data
    await GrowthHacks.deleteMany({});
  });

  test('Filter by next day', async () => {
    const tomorrow = moment()
      .add(1, 'day')
      .endOf('day')
      .format('YYYY-MM-DD');

    await growthHackFactory({ stageId: stage._id, closeDate: new Date(tomorrow) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextDay: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by next week', async () => {
    const nextWeek = moment()
      .day(8)
      .format('YYYY-MM-DD');

    await growthHackFactory({ stageId: stage._id, closeDate: new Date(nextWeek) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextWeek: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by next month', async () => {
    const nextMonth = moment()
      .add(1, 'months')
      .format('YYYY-MM-01');

    await growthHackFactory({ stageId: stage._id, closeDate: new Date(nextMonth) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextMonth: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by has no close date', async () => {
    await growthHackFactory({ stageId: stage._id, noCloseDate: true });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { noCloseDate: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by overdue', async () => {
    const yesterday = moment()
      .utc()
      .subtract(1, 'days')
      .toDate();

    await growthHackFactory({ stageId: stage._id, closeDate: yesterday });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { overdue: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by team members', async () => {
    const { _id } = await userFactory();

    await growthHackFactory({ stageId: stage._id, assignedUserIds: [_id] });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { assignedUserIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Filter by priority', async () => {
    await growthHackFactory({ stageId: stage._id, priority: 'critical' });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { priority: 'critical' });

    expect(response.length).toBe(1);
  });

  test('Filter by hack stage', async () => {
    await growthHackFactory({ stageId: stage._id, hackStages: ['Awareness'] });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { hackStage: 'Awareness' });

    expect(response.length).toBe(1);
  });

  test('Growth hacks', async () => {
    const args = { stageId: stage._id };

    await growthHackFactory({ ...args, impact: 5 });
    await growthHackFactory({ ...args, impact: 10 });
    await growthHackFactory({ ...args, impact: 2 });

    const qry = `
      query growthHacks($stageId: String!, $sortField: String, $sortDirection: Int) {
        growthHacks(stageId: $stageId, sortField: $sortField, sortDirection: $sortDirection) {
          ${commonGrowthHackTypes}
        }
      }
    `;

    let response = await graphqlRequest(qry, 'growthHacks', args);

    expect(response.length).toBe(3);

    response = await graphqlRequest(qry, 'growthHacks', { ...args, sortField: 'impact', sortDirection: -1 });

    expect(response[0].impact).toBe(10);
  });

  test('Growth hacks total count', async () => {
    const args = { stageId: stage._id };

    await growthHackFactory({ ...args, hackStages: ['Awareness'] });
    await growthHackFactory({ ...args, hackStages: ['Awareness'] });
    await growthHackFactory({ ...args });
    await growthHackFactory({ ...args });

    const qry = `
      query growthHacksTotalCount($hackStage: String) {
        growthHacksTotalCount(hackStage: $hackStage)
      }
    `;

    const filter = { hackStage: 'Awareness' };

    const totalCount = await graphqlRequest(qry, 'growthHacksTotalCount', filter);

    expect(totalCount).toBe(2);
  });

  test('Growth hacks priority matrix', async () => {
    await growthHackFactory({ stageId: stage._id, impact: 5, ease: 4 });
    await growthHackFactory({ stageId: stage._id, impact: 7, ease: 2 });

    await growthHackFactory({ stageId: stage._id, impact: 5 });
    await growthHackFactory({ stageId: stage._id, impact: 5, ease: 0 });
    await growthHackFactory({ stageId: stage._id });

    const qry = `
      query growthHacksPriorityMatrix($pipelineId: String) {
        growthHacksPriorityMatrix(pipelineId: $pipelineId)
      }
    `;

    const priorityMatrix = await graphqlRequest(qry, 'growthHacksPriorityMatrix', { pipelineId: pipeline._id });

    expect(priorityMatrix.length).toBe(2);
  });

  test('GrowthHack detail', async () => {
    const form = await formFactory();
    const field = await fieldFactory({
      contentType: 'form',
      contentTypeId: form._id,
    });

    const pipelineWithForm = await pipelineFactory();
    const stageWithForm = await stageFactory({ pipelineId: pipelineWithForm._id, formId: form._id });

    const user = await userFactory();
    const growthHackWithForm = await growthHackFactory({
      stageId: stageWithForm._id,
      watchedUserIds: [user._id],
      votedUserIds: [user._id],
    });

    await formSubmissionFactory({
      formId: form._id,
      contentTypeId: growthHackWithForm._id,
      contentType: 'growthHack',
      formFieldId: field._id,
      value: 'Hey',
    });

    await formSubmissionFactory({
      formId: form._id,
      contentTypeId: growthHackWithForm._id,
      contentType: 'growthHack',
    });

    const qry = `
      query growthHackDetail($_id: String!) {
        growthHackDetail(_id: $_id) {
          ${commonGrowthHackTypes}
        }
      }
    `;

    let response = await graphqlRequest(qry, 'growthHackDetail', { _id: growthHackWithForm._id }, { user });

    expect(response._id).toBe(growthHackWithForm._id);
    expect(response.isWatched).toBe(true);
    expect(response.formSubmissions[field._id]).toBe('Hey');
    expect(response.isVoted).toBe(true);

    const growthHack = await growthHackFactory({ stageId: stage._id });
    response = await graphqlRequest(qry, 'growthHackDetail', { _id: growthHack._id });

    expect(response._id).toBe(growthHack._id);
    expect(response.isVoted).toBe(false);
  });
});
