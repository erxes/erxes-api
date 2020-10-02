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

export const queries = `
  messengerApps(${queryParams}): [MessengerApp]
  messengerAppsCount(${queryParams}): Int
`;

export const mutations = `
  messengerAppsAddKnowledgebase(name: String!, integrationId: String!, topicId: String!): MessengerApp
  messengerAppsAddWebsite(name: String!, integrationId: String!, description: String!, buttonText: String!, url: String!): MessengerApp
  messengerAppsAddLead(name: String!, integrationId: String!, formId: String!): MessengerApp
  messengerAppsEdit(_id: String!, name: String, kind: String, credentials: JSON): MessengerApp
  messengerAppsRemove(_id: String!): JSON
`;
