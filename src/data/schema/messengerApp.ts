export const types = `
  type MessengerApp {
    _id: String!
    kind: String!
    name: String!
    showInInbox: Boolean
    credentials: JSON
    accountId: String
  }

  input WebSiteMessengerAppInput {
    description: String
    buttonText: String
    url: String
  }

  input KnowledgeBaseMessengerAppInput {
    topicId: String
  }

  input LeadMessengerAppInput {
    formCode: String
  }

  input MessengerAppsInput {
    websites: [WebSiteMessengerAppInput]
    knowledgebases: [KnowledgeBaseMessengerAppInput]
    leads: [LeadMessengerAppInput]
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
  messengerAppSave(integrationId: String!, messengerApps: MessengerAppsInput): String
`;
