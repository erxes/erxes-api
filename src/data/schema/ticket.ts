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
    companies: [Company]
    customers: [Customer]
    assignedUsers: [User]
    modifiedAt: Date
    modifiedBy: String
    ${commonTypes}
  }
`;

export const queries = `
  ticketDetail(_id: String!): Ticket
  tickets(stageId: String): [Ticket]
`;
