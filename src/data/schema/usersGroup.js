export const types = `
  type UsersGroup {
    _id: String!
    name: String!
    description: String!
  }
`;

export const queries = `
  usersGroups(page: Int, perPage: Int): [UsersGroup]
  usersGroupsTotalCount: Int
`;

const commonParams = `
  name: String!,
  description: String,
`;

export const mutations = `
  usersGroupsAdd(${commonParams}): UsersGroup
  usersGroupsEdit(_id: String!, ${commonParams}): UsersGroup
  usersGroupsRemove(_id: String!): String
`;
