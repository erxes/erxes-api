export const types = `

input WebhookActionInput {
  type: String
  action: String
  label: String
},

type WebhookAction {
  type: String
  action: String
  label: String
},

type Webhook {
  _id: String!
  isOutgoing: Boolean
  url: String!
  actions: [WebhookAction]
}`;

export const queries = `
  webhooks(isOutgoing: Boolean): [Webhook]
  webhookDetail(_id: String!): Webhook
  webhooksTotalCount(isOutgoing: Boolean): Int
`;

export const mutations = `
	webhooksAdd(isOutgoing: Boolean, url: String!, actions: [WebhookActionInput]): Webhook
	webhooksEdit(_id: String!, isOutgoing: Boolean, url: String!, actions: [WebhookActionInput]): Webhook
  webhooksRemove(ids: [String!]!): JSON
`;
