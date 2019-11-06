export const types = `
  type Conformity {
    _id: String!
    mainType: String
    mainTypeId: String
    relType: String
    relTypeId: String
    content: String
    editAble: Boolean
    createdAt: Date

    createdUser: User
  }

  type SuccessResult {
    success: Boolean,
  }
`;

const commonParams = `
  mainType: String
  mainTypeId: String
  relType: String
  relTypeId: String
`;

const commonParamsCreate = `
  mainType: String
  mainTypeId: String
  relType: String
  relTypeIds: [String]
`;

export const queries = `
  conformitiesForActivity(conformityTypes: [String], contentId: String!, conformityType: String, limit: Int): [Conformity]
`;

export const mutations = `
  conformityAdd(${commonParams}): Conformity
  conformityEdit(${commonParamsCreate}): SuccessResult
`;
