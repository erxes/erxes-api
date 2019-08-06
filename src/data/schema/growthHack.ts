const commonTypes = `
  order: Int
  createdAt: Date
`;

export const types = `
  type IFormField {
    _id: String
    value: String
  }
  
  type GrowthHack {
    _id: String!
    name: String!
    stageId: String
    pipeline: Pipeline
    boardId: String
    companyIds: [String]
    customerIds: [String]
    assignedUserIds: [String]
    closeDate: Date
    description: String
    companies: [Company]
    customers: [Customer]
    hackDescription: String
    formFields: [IFormField]
    goal: String
    assignedUsers: [User]
    modifiedAt: Date
    modifiedBy: String
    stage: Stage
    attachments: [Attachment]
    isWatched: Boolean
    formId: String
    ${commonTypes}
  }
`;

export const queries = `
  growthHackDetail(_id: String!): GrowthHack
  growthHacks(
    initialStageId: String
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
  ): [GrowthHack]
`;

const commonParams = `
  name: String!,
  stageId: String,
  assignedUserIds: [String],
  companyIds: [String],
  attachments: [AttachmentInput],
  customerIds: [String],
  closeDate: Date,
  description: String,
  order: Int,
  goal: String,
  hackDescription: String,
`;

export const mutations = `
  growthHacksAdd(${commonParams}): GrowthHack
  growthHacksEdit(_id: String!, ${commonParams}): GrowthHack
  growthHacksChange( _id: String!, destinationStageId: String): GrowthHack
  growthHacksUpdateOrder(stageId: String!, orders: [OrderItem]): [GrowthHack]
  growthHacksRemove(_id: String!): GrowthHack
  growthHacksWatch(_id: String, isAdd: Boolean): GrowthHack
`;
