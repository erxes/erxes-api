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
    closeDate: Date
    description: String
    modifiedAt: Date
    modifiedBy: String
    ${commonTypes}
  }
`;

export const queries = `
  ticketDetail(_id: String!): Ticket
  tickets(stageId: String): [Ticket]
`;
