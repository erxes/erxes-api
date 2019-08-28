const commonTypes = `
  order: Int
  createdAt: Date
`;

export const types = `
  type Task {
    _id: String!
    name: String!
    stageId: String
    boardId: String
    assignedUserIds: [String]
    closeDate: Date
    description: String
    priority: String
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
  taskDetail(_id: String!): Task
  tasks(
    pipelineId: String
    stageId: String
    mainType: String
    mainTypeId: String
    relType: String
    isRelated: Boolean
    isSaved: Boolean
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
  ): [Task]
`;

const commonParams = `
  stageId: String,
  assignedUserIds: [String],
  attachments: [AttachmentInput],
  closeDate: Date,
  description: String,
  order: Int,
  priority: String,
`;

export const mutations = `
  tasksAdd(name: String!, ${commonParams}): Task
  tasksEdit(_id: String!, name: String, ${commonParams}): Task
  tasksChange( _id: String!, destinationStageId: String): Task
  tasksUpdateOrder(stageId: String!, orders: [OrderItem]): [Task]
  tasksRemove(_id: String!): Task
  tasksWatch(_id: String, isAdd: Boolean): Task
`;
