const types = `
  type Log {
    _id: String
    createdAt: Date
    createdBy: String
    type: String
    action: String
    oldData: String
    newData: String
    objectId: String
    unicode: String
    description: String
  }

  type LogsWithCount {
    logs: [Log]
    totalCount: Int
  }
`;

const queries = `
  logs(
    start: String,
    end: String,
    userId: String,
    action: String,
    page: Int,
    perPage: Int
  ): LogsWithCount
`;

export { types, queries };
