export const types = `
  type ActivityLogYearMonthDoc {
    year: Int
    month: Int
  }

  type ActivityLogForMonth {
    date: ActivityLogYearMonthDoc!
    list: [ActivityLog]!
  }

  type ActivityLogPerformerDetails {
    avatar: String
    fullName: String
    position: String
  }

  type ActivityLogActionPerformer {
    _id: String
    type: String!
    details: ActivityLogPerformerDetails
  }

  type ActivityLog {
    _id: String!
    action: String!
    id: String
    createdAt: Date!
    content: String
    by: ActivityLogActionPerformer
  }
`;

export const queries = `
  activityLogsCustomer(_id: String!): [ActivityLogForMonth]
  activityLogsCompany(_id: String!): [ActivityLogForMonth]
  activityLogsUser(_id: String!): [ActivityLogForMonth]
  activityLogsDeal(_id: String!): [ActivityLogForMonth]
`;
