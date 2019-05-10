export const types = `
  type Callout {
    title: String,
    body: String,
    buttonText: String,
    featuredImage: String,
    skip: Boolean
  }

  type FormRule {
    _id : String!,
    kind: String!,
    text: String!,
    condition: String!,
    value: String,
  }

  type Form {
    _id: String!
    title: String
    code: String
    description: String
    buttonText: String
    themeColor: String
    callout: Callout
    createdUserId: String
    createdUser: User
    createdDate: Date
    viewCount: Int
    rules: [FormRule]
    contactsGathered: Int
    tagIds: [String]
    getTags: [Tag]
  }
`;

const commonFields = `
  title: String,
  description: String,
  buttonText: String,
  themeColor: String,
  callout: JSON
`;

export const queries = `
  formDetail(_id: String!): Form
  forms: [Form]
`;

export const mutations = `
  formsAdd(${commonFields}): Form
  formsEdit(_id: String!, ${commonFields} ): Form
`;
