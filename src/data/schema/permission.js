export const types = `
  type Permission {
    _id: String!
    module: String
    action: String
    userId: String
    requiredActions: [String]
    allowed: Boolean

    user: User
  }

  type PermissionModule {
    name: String
    description: String
  }

  type PermissionAction {
    name: String
    description: String
    module: String
  }
`;

const commonParams = `
  module: String,
  action: String,
  userId: String
`;

export const queries = `
  permissions(${commonParams}, page: Int, perPage: Int): [Permission]
  permissionModules: [PermissionModule]
  permissionActions(moduleName: String): [PermissionAction]
  permissionsTotalCount(${commonParams}): Int
`;

export const mutations = `
	permissionsAdd(
    module: String!,
    actions: [String!]!,
    userIds: [String!]!,
    allowed: Boolean
  ): [Permission]
  permissionsRemove(ids: [String]!): String
`;
