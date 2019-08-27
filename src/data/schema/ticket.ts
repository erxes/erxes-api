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
    assignedUserIds: [String]
    closeDate: Date
    description: String
    priority: String
    source: String
    companies: [Company]
    customers: [Customer]
    assignedUsers: [User]
    isWatched: Boolean
    attachments: [Attachment]
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
    mainType: String
    mainTypeId: String
    relType: String
    isRelated: Boolean
    date: ItemDate
    skip: Int
    search: String
    companyIds: [String]
    customerIds: [String]
    assignedUserIds: [String]
    nextDay: String
    nextWeek: String
    nextMonth: String
    noCloseDate: String
    overdue: String
    priority: [String]
    source: [String]
  ): [Ticket]
`;

const commonParams = `
  name: String,
  stageId: String,
  assignedUserIds: [String],
  attachments: [AttachmentInput],
  closeDate: Date,
  description: String,
  order: Int,
  priority: String,
  source: String
`;

export const mutations = `
  ticketsAdd(name: String!, ${commonParams}): Ticket
  ticketsEdit(_id: String!, name: String, ${commonParams}): Ticket
  ticketsChange( _id: String!, destinationStageId: String): Ticket
  ticketsUpdateOrder(stageId: String!, orders: [OrderItem]): [Ticket]
  ticketsRemove(_id: String!): Ticket
  ticketsWatch(_id: String, isAdd: Boolean): Ticket
`;
