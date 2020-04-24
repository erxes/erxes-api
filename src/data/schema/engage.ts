export const types = `
  type EngageMessage {
    _id: String!
    kind: String
    tagIds: [String]
    segmentIds: [String]
    brandIds: [String]
    customerIds: [String]
    title: String
    fromUserId: String
    method: String
    isDraft: Boolean
    isLive: Boolean
    stopDate: Date
    createdAt: Date
    type: String
    messengerReceivedCustomerIds: [String]
    totalCustomersCount: Int
    validCustomersCount: Int

    brand: Brand

    email: JSON
    messenger: JSON

    scheduleDate: EngageScheduleDate
    segments: [Segment]
    tags: [Tag]
    brands: [Brand]
    fromUser: User
    getTags: [Tag]

    stats: JSON
    logs: JSON
  }

  type EngageScheduleDate {
    type: String,
    month: String,
    day: String,
  }

  input EngageScheduleDateInput {
    type: String,
    month: String,
    day: String,
  }

  input EngageMessageEmail {
    content: String,
    subject: String!,
    attachments: [JSON]
    templateId: String
  }

  input EngageMessageMessenger {
    brandId: String!,
    kind: String,
    sentAs: String,
    content: String,
    rules: [InputRule],
  }
`;

const listParams = `
  kind: String
  status: String
  segmentIds: [String]
  brandIds: [String]
  tagIds: [String]
  tag: String
  ids: [String]
  page: Int
  perPage: Int
`;

export const queries = `
  engageMessages(${listParams}): [EngageMessage]
  engageMessagesTotalCount(${listParams}): Int
  engageMessageDetail(_id: String): EngageMessage
  engageMessageCounts(name: String!, kind: String, status: String): JSON
  engagesConfigDetail: JSON
  engageVerifiedEmails: [String]
`;

const commonParams = `
  title: String!,
  kind: String!,
  method: String!,
  fromUserId: String!,
  isDraft: Boolean,
  isLive: Boolean,
  stopDate: Date,
  scheduleDate: Date,
  type: String
  segmentIds: [String],
  tagIds: [String],
  brandIds: [String],
  customerIds: [String],
  email: EngageMessageEmail,
  scheduleDate: EngageScheduleDateInput,
  messenger: EngageMessageMessenger,
`;

export const mutations = `
  engageMessageAdd(${commonParams}): EngageMessage
  engageMessageEdit(_id: String!, ${commonParams}): EngageMessage
  engageMessageRemove(_id: String!): EngageMessage
  engageMessageSetLive(_id: String!): EngageMessage
  engageMessageSetPause(_id: String!): EngageMessage
  engageMessageSetLiveManual(_id: String!): EngageMessage
  engagesUpdateConfigs(configsMap: JSON!): JSON
  engageMessageVerifyEmail(email: String!): String
  engageMessageRemoveVerifiedEmail(email: String!): String
  engageMessageSendTestEmail(from: String!, to: String!, content: String!): String
`;
