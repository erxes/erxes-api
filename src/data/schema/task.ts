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
    typeId: String,
    contentType: String,
    contentId: String,
    assignedUserIds: [String]
    closeDate: Date
    description: String
    priority: String
    type: TaskType
    assignedUsers: [User]
    isWatched: Boolean
    isDone: Boolean
    attachments: [Attachment]
    stage: Stage
    pipeline: Pipeline
    modifiedAt: Date
    modifiedBy: String
    content: JSON
    ${commonTypes}
  }
`;

export const queries = `
  taskDetail(_id: String!): Task
  tasks(
    pipelineId: String
    stageId: String
    contentType: String,
    contentId: String,
    date: ItemDate
    skip: Int
    search: String
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
  name: String!,
  isDone: Boolean,
  stageId: String
  contentType: String,
  contentId: String,
  typeId: String,
  assignedUserIds: [String],
  attachments: [AttachmentInput],
  closeDate: Date,
  description: String,
  order: Int,
  priority: String,
`;

export const mutations = `
  tasksAdd(${commonParams}): Task
  tasksEdit(_id: String!, ${commonParams}): Task
  tasksChange( _id: String!, destinationStageId: String): Task
  tasksUpdateOrder(stageId: String!, orders: [OrderItem]): [Task]
  tasksRemove(_id: String!): Task
  tasksWatch(_id: String, isAdd: Boolean): Task
  tasksChangeStatus(_id: String!): Task
`;
