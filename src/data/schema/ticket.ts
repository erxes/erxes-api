const commonTypes = `
  order: Int
  createdAt: Date
`;

export const types = `
  type Ticket {
    _id: String!
    name: String!
    stageId: String
    boardId: String
    companyIds: [String]
    customerIds: [String]
    assignedUserIds: [String]
    closeDate: Date
    description: String
    priority: String
    source: String
    companies: [Company]
    customers: [Customer]
    assignedUsers: [User]
    stage: Stage
    pipeline: Pipeline
    modifiedAt: Date
    modifiedBy: String
    ${commonTypes}
  }
`;

export const queries = `
  ticketDetail(_id: String!): Ticket
  tickets(
    pipelineId: String
    stageId: String
    customerIds: [String]
    companyIds: [String]
    date: ItemDate
    skip: Int
    search: String
    assignedUserIds: [String]
    nextDay: String
    nextWeek: String
    nextMonth: String
    noCloseDate: String
    overdue: String
    priority: String
    source: String
  ): [Ticket]
`;

const commonParams = `
  name: String!,
  stageId: String,
  assignedUserIds: [String],
  companyIds: [String],
  customerIds: [String],
  closeDate: Date,
  description: String,
  order: Int,
  priority: String,
  source: String
`;

export const mutations = `
  ticketsAdd(${commonParams}): Ticket
  ticketsEdit(_id: String!, ${commonParams}): Ticket
  ticketsChange( _id: String!, destinationStageId: String): Ticket
  ticketsUpdateOrder(stageId: String!, orders: [OrderItem]): [Ticket]
  ticketsRemove(_id: String!): Ticket
`;
