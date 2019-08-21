export const types = `
  type Lead {
    _id: String!
    formId: String!
    themeColor: String
    callout: Callout
    createdUserId: String
    createdUser: User
    createdDate: Date
    viewCount: Int
    rules: [Rule]
    contactsGathered: Int
    tagIds: [String]
    getTags: [Tag]
  }
`;

const commonFields = `
  formId: String!,
  themeColor: String,
  callout: JSON,
  rules: [InputRule]
`;

export const queries = `
  leadDetail(_id: String!): Lead
  leads: [Lead]
`;

export const mutations = `
  leadsAdd(${commonFields}): Lead
  leadsEdit(_id: String!, ${commonFields} ): Lead
`;
