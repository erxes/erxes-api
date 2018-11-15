import { generateModels } from '../../connectionResolver';
import { DealBoards, DealPipelines, Deals, DealStages } from './Deals';
import Products from './Products';
import ResponseTemplates from './ResponseTemplates';
import Segments from './Segments';
import Session from './Session';
import Tags from './Tags';

const {
  Users,
  Customers,
  Brands,
  Channels,
  Configs,
  Integrations,
  Companies,
  ActivityLogs,
  ConversationMessages,
  Conversations,
  EmailTemplates,
  EngageMessages,
  Fields,
  FieldsGroups,
  Forms,
  ImportHistory,
  InternalNotes,
  KnowledgeBaseArticles,
  KnowledgeBaseCategories,
  KnowledgeBaseTopics,
  MessengerApps,
  NotificationConfigurations,
  Notifications,
} = generateModels();

export {
  Users,
  Session,
  Channels,
  ResponseTemplates,
  EmailTemplates,
  Integrations,
  Brands,
  Forms,
  EngageMessages,
  Tags,
  Fields,
  Segments,
  InternalNotes,
  Customers,
  Companies,
  Conversations,
  ConversationMessages,
  KnowledgeBaseArticles,
  KnowledgeBaseCategories,
  KnowledgeBaseTopics,
  Notifications,
  NotificationConfigurations,
  ActivityLogs,
  DealBoards,
  DealPipelines,
  DealStages,
  Deals,
  Products,
  Configs,
  FieldsGroups,
  ImportHistory,
  MessengerApps,
};
