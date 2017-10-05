import { types as UserTypes, queries as UserQueries } from './user';

import {
  types as ChannelTypes,
  queries as ChannelQueries,
  mutations as ChannelMutations,
} from './channel';

import { types as BrandTypes, queries as BrandQueries, mutations as BrandMutations } from './brand';

import { types as IntegrationTypes, queries as IntegrationQueries } from './integration';

import {
  types as ResponseTemplate,
  queries as ResponseTemplateQueries,
  mutations as ResponseTemplateMutations,
} from './responseTemplate';

import {
  types as EmailTemplate,
  queries as EmailTemplateQueries,
  mutations as EmailTemplateMutations,
} from './emailTemplate';

import { types as FormTypes, queries as FormQueries, mutations as FormMutatons } from './form';

import { types as EngageTypes, queries as EngageQueries } from './engage';

import { types as TagTypes, queries as TagQueries, mutations as TagMutations } from './tag';

import { types as CustomerTypes, queries as CustomerQueries } from './customer';

import { types as InsightTypes, queries as InsightQueries } from './insight';

import { types as KnowledgeBaseTypes, queries as KnowledgeBaseQueries } from './knowledgeBase';

import {
  types as ConversationTypes,
  queries as ConversationQueries,
  mutations as ConversationMutations,
} from './conversation';

export const types = `
  scalar JSON
  scalar Date

  ${UserTypes}
  ${ChannelTypes}
  ${BrandTypes}
  ${IntegrationTypes}
  ${ResponseTemplate}
  ${EmailTemplate}
  ${EngageTypes}
  ${TagTypes}
  ${FormTypes}
  ${CustomerTypes}
  ${ConversationTypes}
  ${InsightTypes}
  ${KnowledgeBaseTypes}
`;

export const queries = `
  type Query {
    ${UserQueries}
    ${ChannelQueries}
    ${BrandQueries}
    ${IntegrationQueries}
    ${ResponseTemplateQueries}
    ${EmailTemplateQueries}
    ${FormQueries}
    ${EngageQueries}
    ${TagQueries}
    ${CustomerQueries}
    ${ConversationQueries}
    ${InsightQueries}
    ${KnowledgeBaseQueries}
  }
`;

export const mutations = `
  type Mutation {
    ${ConversationMutations}
    ${ChannelMutations}
    ${BrandMutations}
    ${EmailTemplateMutations}
    ${ResponseTemplateMutations}
    ${TagMutations}
    ${FormMutatons}
  }
`;

export const subscriptions = `
  type Subscription {
    conversationChanged(_id: String!): ConversationChangedResponse
    conversationMessageInserted(_id: String!): ConversationMessage
    conversationsChanged(customerId: String): ConversationsChangedResponse
  }
`;
