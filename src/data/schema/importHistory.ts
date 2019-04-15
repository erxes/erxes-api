export const types = `
  type ImportHistory {
    _id: String!
    success: String!
    failed: String
    total: String
    ids: [String]
    contentType: String
    errorMsgs: [String]
    status: String
    percentage: Int

    date: Date
    user: User
  }
`;

export const queries = `
  importHistories(perPage: Int, page: Int, type: String!): [ImportHistory]
  importHistoryDetail(_id: String!): ImportHistory
`;

export const mutations = `
  importHistoriesRemove(_id: String!): JSON
`;
