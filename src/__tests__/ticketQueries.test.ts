import { graphqlRequest } from '../db/connection';
import {
  boardFactory,
  companyFactory,
  conformityFactory,
  customerFactory,
  fieldFactory,
  pipelineFactory,
  pipelineLabelFactory,
  productFactory,
  stageFactory,
  ticketFactory,
  userFactory,
} from '../db/factories';
import { Boards, Pipelines, Stages, Tickets } from '../db/models';

import { BOARD_TYPES } from '../db/models/definitions/constants';
import './setup.ts';

describe('ticketQueries', () => {
  const commonTicketFields = `
    _id
    userId
    createdAt
    order
    name
    closeDate
    reminderMinute
    isComplete
    description
    assignedUserIds
    watchedUserIds
    labelIds
    stageId
    initialStageId
    modifiedAt
    modifiedBy
    priority
    productsData
    source

    companies { _id }
    customers { _id }
    assignedUsers { _id }
    boardId
    pipeline { _id }
    stage { _id }
    isWatched
    hasNotified
    labels { _id }
    products
    amount
  `;

  const qryTicketFilter = `
    query tickets(
      $stageId: String
      $assignedUserIds: [String]
      $customerIds: [String]
      $companyIds: [String]
      $priority: [String]
      $source: [String]
      $closeDateType: String
    ) {
      tickets(
        stageId: $stageId
        customerIds: $customerIds
        assignedUserIds: $assignedUserIds
        companyIds: $companyIds
        priority: $priority
        source: $source
        closeDateType: $closeDateType
      ) {
        ${commonTicketFields}
      }
    }
  `;

  const qryDetail = `
    query ticketDetail($_id: String!) {
      ticketDetail(_id: $_id) {
        ${commonTicketFields}
      }
    }
  `;

  afterEach(async () => {
    // Clearing test data
    await Boards.deleteMany({});
    await Pipelines.deleteMany({});
    await Stages.deleteMany({});
    await Tickets.deleteMany({});
  });

  test('Ticket filter by team members', async () => {
    const { _id } = await userFactory();

    await ticketFactory({ assignedUserIds: [_id] });

    const response = await graphqlRequest(qryTicketFilter, 'tickets', { assignedUserIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Ticket filter by customers', async () => {
    const { _id } = await customerFactory();

    const ticket = await ticketFactory({});

    await conformityFactory({
      mainType: 'ticket',
      mainTypeId: ticket._id,
      relType: 'customer',
      relTypeId: _id,
    });

    const response = await graphqlRequest(qryTicketFilter, 'tickets', { customerIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Ticket filter by companies', async () => {
    const { _id } = await companyFactory();

    const ticket = await ticketFactory({});

    await conformityFactory({
      mainType: 'company',
      mainTypeId: _id,
      relType: 'ticket',
      relTypeId: ticket._id,
    });

    const response = await graphqlRequest(qryTicketFilter, 'tickets', { companyIds: [_id] });

    expect(response.length).toBe(1);
  });

  test('Ticket filter by priority', async () => {
    await ticketFactory({ priority: 'critical' });

    const response = await graphqlRequest(qryTicketFilter, 'tickets', { priority: ['critical'] });

    expect(response.length).toBe(1);
  });

  test('Ticket filter by source', async () => {
    await ticketFactory({ source: 'messenger' });

    const response = await graphqlRequest(qryTicketFilter, 'tickets', { source: ['messenger'] });

    expect(response.length).toBe(1);
  });

  test('Tickets', async () => {
    const board = await boardFactory({ type: BOARD_TYPES.TICKET });
    const pipeline = await pipelineFactory({ boardId: board._id, type: BOARD_TYPES.TICKET });
    const stage = await stageFactory({ pipelineId: pipeline._id, type: BOARD_TYPES.TICKET });
    const args = { stageId: stage._id };

    await ticketFactory(args);
    await ticketFactory(args);
    await ticketFactory(args);

    const qryList = `
      query tickets($stageId: String!) {
        tickets(stageId: $stageId) {
          ${commonTicketFields}
        }
      }
    `;

    const response = await graphqlRequest(qryList, 'tickets', args);

    expect(response.length).toBe(3);
  });

  test('Ticket detail', async () => {
    const field = await fieldFactory({ contentType: 'product', text: 'text' });
    const customFieldsData = { [field._id]: 'field1' };
    const product1 = await productFactory({ customFieldsData });
    const product2 = await productFactory({ customFieldsData });
    const user1 = await userFactory();
    const user2 = await userFactory();
    const label1 = await pipelineLabelFactory();
    const label2 = await pipelineLabelFactory();
    const board = await boardFactory({ type: BOARD_TYPES.TICKET });
    const pipeline = await pipelineFactory({ boardId: board._id, type: BOARD_TYPES.TICKET });
    const stage = await stageFactory({ pipelineId: pipeline._id, type: BOARD_TYPES.TICKET });

    const productsData = [
      {
        productId: product1._id,
        currency: 'USD',
        amount: 200,
      },
      {
        productId: product2._id,
        currency: 'MNT',
        amount: 300,
      },
    ];

    const ticket = await ticketFactory({
      productsData,
      assignedUserIds: [user1._id],
      watchedUserIds: [user2._id],
      labelIds: [label1._id, label2._id],
      stageId: stage._id,
    });

    const response = await graphqlRequest(qryDetail, 'ticketDetail', { _id: ticket._id }, { user: user2 });

    expect(response._id).toBe(ticket._id);
    expect(response.userId).toBe(ticket.userId);
    expect(response.order).toBe(ticket.order);
    expect(response.name).toBe(ticket.name);
    expect(response.reminderMinute).toBe(ticket.reminderMinute);
    expect(response.isComplete).toBe(ticket.isComplete);
    expect(response.description).toBe(ticket.description);
    expect(response.assignedUserIds.length).toBe((ticket.assignedUserIds || []).length);
    expect(response.watchedUserIds.length).toBe((ticket.watchedUserIds || []).length);
    expect(response.labelIds.length).toBe((ticket.labelIds || []).length);
    expect(response.stageId).toBe(ticket.stageId);
    expect(response.initialStageId).toBe(ticket.initialStageId);
    expect(response.modifiedBy).toBe(ticket.modifiedBy);
    expect(response.priority).toBe(ticket.priority);
    expect(response.source).toBe(ticket.source);
    expect(response.productsData.length).toBe(2);
    // resolvers
    expect(response.labels.length).toBe(2);
    expect(response.amount).toMatchObject({ USD: 200, MNT: 300 });
    expect(response.stage._id).toBe(stage._id);
    expect(response.boardId).toBe(board._id);
    expect(response.assignedUsers.length).toBe(1);
    expect(response.pipeline._id).toBe(pipeline._id);
    expect(response.isWatched).toBe(true);
    expect(response.products.length).toBe(2);
  });

  test('Ticket detail with watchedUserIds', async () => {
    const user = await userFactory();
    const watchedTask = await ticketFactory({ watchedUserIds: [user._id] });

    const response = await graphqlRequest(
      qryDetail,
      'ticketDetail',
      {
        _id: watchedTask._id,
      },
      { user },
    );

    expect(response._id).toBe(watchedTask._id);
    expect(response.isWatched).toBe(true);
  });
});
