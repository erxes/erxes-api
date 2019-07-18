export const types = `
  type TaskType {
    _id: String!
    name: String!
    icon: String!
  }
`;

export const queries = `
  taskTypeDetail(_id: String!): TaskType
  taskTypes: [TaskType]
`;

const commonParams = `
  name: String!,
  icon: String!
`;

export const mutations = `
  taskTypesAdd(${commonParams}): TaskType
  taskTypesEdit(_id: String!, ${commonParams}): TaskType
  taskTypesRemove(_id: String!): TaskType
`;
