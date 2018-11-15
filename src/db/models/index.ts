import { generateModels } from '../../connectionResolver';
import { DealBoards, DealPipelines, Deals, DealStages } from './Deals';
import ImportHistory from './ImportHistory';
import InternalNotes from './InternalNotes';
import { KnowledgeBaseArticles, KnowledgeBaseCategories, KnowledgeBaseTopics } from './KnowledgeBase';
import MessengerApps from './MessengerApps';
import { NotificationConfigurations, Notifications } from './Notifications';
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
