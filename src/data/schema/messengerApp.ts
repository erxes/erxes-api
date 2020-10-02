export const types = `
  type MessengerApp {
    _id: String!
    kind: String!
    name: String!
    showInInbox: Boolean
    credentials: JSON
    accountId: String
  }
`;

const queryParams = `
  kind: String
  integrationId: String
`;

const mutationParams = `
  name: String
  kind: String
  credentials: JSON
`;

export const queries = `
  messengerApps(${queryParams}): [MessengerApp]
  messengerAppsCount(${queryParams}): Int
`;

export const mutations = `
  messengerAppsAdd(${mutationParams}): MessengerApp
  messengerAppsEdit(_id: String!, ${mutationParams}): MessengerApp
  messengerAppsRemove(_id: String!): JSON
`;
