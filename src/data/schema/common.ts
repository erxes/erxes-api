const ruleFields = `
  _id : String!,
  kind: String!,
  text: String!,
  condition: String!,
  value: String,
`;

export const types = `
  type Rule {
    ${ruleFields}
  }

  input InputRule {
    ${ruleFields}
  }
`;

export const conformityQueryFields = `
  conformityMainType: String
  conformityMainTypeId: String
  conformityIsRelated: Boolean
  conformityIsSaved: Boolean
`;

export const commonTypes = `
  userId: String
  name: String!
  order: Int
  createdAt: Date
  hasNotified: Boolean
  assignedUserIds: [String]
  watchedUserIds: [String]
  labelIds: [String]
  closeDate: Date
  description: String
  modifiedAt: Date
  modifiedBy: String
  reminderMinute: Int,
  isComplete: Boolean,
  isWatched: Boolean,
  stageId: String
  priority: String
  initialStageId: String
  
  labels: [PipelineLabel]
  assignedUsers: [User]
  stage: Stage
  pipeline: Pipeline
  boardId: String
  attachments: [Attachment]
`;
