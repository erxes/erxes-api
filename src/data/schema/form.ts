export const types = `
  type Callout {
    title: String,
    body: String,
    buttonText: String,
    featuredImage: String,
    skip: Boolean
  }

  type Form {
    _id: String!
    title: String
    code: String
    type: String
    description: String
    buttonText: String
    createdUserId: String
    createdUser: User
    createdDate: Date
  }

  type Form {
    _id: String!
    customerId: String
    formId: String
    submittedAt: Date
  }
`;

const commonFields = `
  title: String,
  description: String,
  buttonText: String,
  type: String!
`;

const formSubmissionFields = `
  customerId: String,
  formId: String,
`;

export const queries = `
  formDetail(_id: String!): Form
  forms: [Form]
`;

export const mutations = `
  formsAdd(${commonFields}): Form
  formSubmissionsAdd(${formSubmissionFields}): FormSubmission
  formsEdit(_id: String!, ${commonFields} ): Form
`;
