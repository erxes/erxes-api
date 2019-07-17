export const types = `
  type Config {
    _id: String!
    code: String!
    value: [String]!
  }

  type GitInfos {
    packageVersion: String
    branch: String
    sha: String
    abbreviatedSha: String
  }

  type ProjectInfos {
    erxesVersion: GitInfos
    apiVersion: GitInfos
    widgetVersion: GitInfos
    widgetApiVersion: GitInfos
  }
`;

export const queries = `
  configsDetail(code: String!): Config
  configsVersions: ProjectInfos
  engagesConfigDetail: JSON
`;

export const mutations = `
  configsInsert(code: String!, value: [String]!): Config
  engagesConfigSave(accessKeyId: String, secretAccessKey: String, ): JSON
`;
