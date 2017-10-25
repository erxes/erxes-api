import { types as UserTypes, queries as UserQueries, mutations as UserMutations } from './user';

import {
  types as CompanyTypes,
  queries as CompanyQueries,
  mutations as CompanyMutations,
} from './company';

import {
  types as ChannelTypes,
  queries as ChannelQueries,
  mutations as ChannelMutations,
} from './channel';

import { types as BrandTypes, queries as BrandQueries, mutations as BrandMutations } from './brand';

import {
  types as IntegrationTypes,
  queries as IntegrationQueries,
  mutations as IntegrationMutations,
} from './integration';

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

import { types as FieldTypes, queries as FieldQueries, mutations as FieldMutations } from './field';

import { types as FormTypes, queries as FormQueries, mutations as FormMutatons } from './form';

import {
  types as EngageTypes,
  queries as EngageQueries,
  mutations as EngageMutations,
} from './engage';

import { types as TagTypes, queries as TagQueries, mutations as TagMutations } from './tag';

import {
  types as InternalNoteTypes,
  queries as InternalNoteQueries,
  mutations as InternalNoteMutations,
} from './internalNote';

import {
  types as CustomerTypes,
  queries as CustomerQueries,
  mutations as CustomerMutations,
} from './customer';

import {
  types as SegmentTypes,
  queries as SegmentQueries,
  mutations as SegmentMutations,
} from './segment';

import { types as InsightTypes, queries as InsightQueries } from './insight';

import { types as KnowledgeBaseTypes, queries as KnowledgeBaseQueries } from './knowledgeBase';

import {
  types as NotificationTypes,
  queries as NotificationQueries,
  mutations as NotificationMutations,
} from './notification';

import {
  types as ConversationTypes,
  queries as ConversationQueries,
  mutations as ConversationMutations,
} from './conversation';

export const types = `
  scalar JSON
  scalar Date

  ${UserTypes}
  ${InternalNoteTypes}
  ${CompanyTypes}
  ${ChannelTypes}
  ${BrandTypes}
  ${IntegrationTypes}
  ${ResponseTemplate}
  ${EmailTemplate}
  ${EngageTypes}
  ${TagTypes}
  ${FieldTypes}
  ${FormTypes}
  ${CustomerTypes}
  ${SegmentTypes}
  ${ConversationTypes}
  ${InsightTypes}
  ${KnowledgeBaseTypes}
  ${NotificationTypes}
`;

export const queries = `
  type Query {
    ${UserQueries}
    ${ChannelQueries}
    ${BrandQueries}
    ${IntegrationQueries}
    ${ResponseTemplateQueries}
    ${EmailTemplateQueries}
    ${FieldQueries}
    ${FormQueries}
    ${EngageQueries}
    ${TagQueries}
    ${InternalNoteQueries}
    ${CompanyQueries}
    ${CustomerQueries}
    ${SegmentQueries}
    ${ConversationQueries}
    ${InsightQueries}
    ${KnowledgeBaseQueries}
    ${NotificationQueries}
  }
`;

export const mutations = `
  type Mutation {
    ${UserMutations}
    ${CompanyMutations}
    ${ConversationMutations}
    ${EngageMutations}
    ${TagMutations}
    ${BrandMutations}
    ${ResponseTemplateMutations}
    ${EmailTemplateMutations}
    ${InternalNoteMutations}
    ${CustomerMutations}
    ${SegmentMutations}
    ${FieldMutations}
    ${ChannelMutations}
    ${FormMutatons}
    ${IntegrationMutations}
    ${NotificationMutations}
  }
`;

export const subscriptions = `
  type Subscription {
    conversationChanged(_id: String!): ConversationChangedResponse
    conversationMessageInserted(_id: String!): ConversationMessage
    conversationsChanged(customerId: String): ConversationsChangedResponse
  }
`;
