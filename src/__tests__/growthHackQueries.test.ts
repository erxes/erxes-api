import * as moment from 'moment';
import { graphqlRequest } from '../db/connection';
import { growthHackFactory, pipelineFactory, stageFactory, userFactory } from '../db/factories';
import { GrowthHacks } from '../db/models';

import './setup.ts';

describe('growthHackQueries', () => {
  const commonGrowthHackTypes = `
    _id
    name
    stageId
    assignedUserIds
    closeDate
    description
    assignedUsers {
      _id
    }
    impact
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

  afterEach(async () => {
    // Clearing test data
    await GrowthHacks.deleteMany({});
  });

  test('Filter by next day', async () => {
    const tomorrow = moment()
      .add(1, 'day')
      .endOf('day')
      .format('YYYY-MM-DD');

    await growthHackFactory({ closeDate: new Date(tomorrow) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextDay: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by next week', async () => {
    const nextWeek = moment()
      .day(8)
      .format('YYYY-MM-DD');

    await growthHackFactory({ closeDate: new Date(nextWeek) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextWeek: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by next month', async () => {
    const nextMonth = moment()
      .add(1, 'months')
      .format('YYYY-MM-01');

    await growthHackFactory({ closeDate: new Date(nextMonth) });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { nextMonth: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by has no close date', async () => {
    await growthHackFactory({ noCloseDate: true });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { noCloseDate: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by overdue', async () => {
    const yesterday = moment()
      .utc()
      .subtract(1, 'days')
      .toDate();

    await growthHackFactory({ closeDate: yesterday });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { overdue: 'true' });

    expect(response.length).toBe(1);
  });

  test('Filter by team members', async () => {
    const { _id } = await userFactory();

    await growthHackFactory({ assignedUserIds: [_id] });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { assignedUserIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Filter by priority', async () => {
    await growthHackFactory({ priority: 'critical' });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { priority: 'critical' });

    expect(response.length).toBe(1);
  });

  test('Filter by hack stage', async () => {
    await growthHackFactory({ hackStages: ['Awareness'] });

    const response = await graphqlRequest(qryGrowthHackFilter, 'growthHacks', { hackStage: 'Awareness' });

    expect(response.length).toBe(1);
  });

  test('Growth hacks', async () => {
    const stage = await stageFactory();

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
    await growthHackFactory({ hackStages: ['Awareness'] });
    await growthHackFactory({ hackStages: ['Awareness'] });
    await growthHackFactory();
    await growthHackFactory();

    const qry = `
      query growthHacksTotalCount($hackStage: String) {
        growthHacksTotalCount(hackStage: $hackStage)
      }
    `;

    const args = { hackStage: 'Awareness' };

    const totalCount = await graphqlRequest(qry, 'growthHacksTotalCount', args);

    expect(totalCount).toBe(2);
  });

  test('Growth hacks priority matrix', async () => {
    const pipeline = await pipelineFactory();
    const stage = await stageFactory({ pipelineId: pipeline._id });

    await growthHackFactory({ impact: 5, ease: 4, stageId: stage._id });
    await growthHackFactory({ impact: 7, ease: 2 });

    await growthHackFactory({ impact: 5 });
    await growthHackFactory({ impact: 5, ease: 0 });
    await growthHackFactory();

    const qry = `
      query growthHacksPriorityMatrix($pipelineId: String) {
        growthHacksPriorityMatrix(pipelineId: $pipelineId)
      }
    `;

    const priorityMatrix = await graphqlRequest(qry, 'growthHacksPriorityMatrix', { pipelineId: pipeline._id });

    expect(priorityMatrix.length).toBe(1);
  });

  test('GrowthHack detail', async () => {
    const growthHack = await growthHackFactory();

    const args = { _id: growthHack._id };

    const qry = `
      query growthHackDetail($_id: String!) {
        growthHackDetail(_id: $_id) {
          ${commonGrowthHackTypes}
        }
      }
    `;

    const response = await graphqlRequest(qry, 'growthHackDetail', args);

    expect(response._id).toBe(growthHack._id);
  });
});
