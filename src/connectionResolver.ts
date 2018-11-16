import * as mongoose from 'mongoose';
import { IActivityLogModel, loadClass as loadActivityLogClass } from './db/models/ActivityLogs';
import { IBrandModel, loadClass as loadBrandClass } from './db/models/Brands';
import { IChannelModel, loadClass as loadChannelClass } from './db/models/Channels';
import { ICompanyModel, loadClass as loadCompanyClass } from './db/models/Companies';
import { IConfigModel, loadClass as loadConfigClass } from './db/models/Configs';
import {
  IMessageModel as IConversationMessageModel,
  loadClass as loadConversationMessageClass,
} from './db/models/ConversationMessages';
import { IConversationModel, loadClass as loadConversationClass } from './db/models/Conversations';
import { ICustomerModel, loadClass as loadCustomerClass } from './db/models/Customers';
import {
  IBoardModel,
  IDealModel,
  IPipelineModel,
  IStageModel,
  loadBoardClass,
  loadDealClass,
  loadPipelineClass,
  loadStageClass,
} from './db/models/Deals';
import { IActivityLogDocument } from './db/models/definitions/activityLogs';
import { IBrandDocument } from './db/models/definitions/brands';
import { IChannelDocument } from './db/models/definitions/channels';
import { ICompanyDocument } from './db/models/definitions/companies';
import { IConfigDocument } from './db/models/definitions/configs';
import { IMessageDocument as IConversationMessageDocument } from './db/models/definitions/conversationMessages';
import { IConversationDocument } from './db/models/definitions/conversations';
import { ICustomerDocument } from './db/models/definitions/customers';
import {
  IBoardDocument,
  IDealDocument,
  IPipelineDocument,
  IProductDocument,
  IStageDocument,
} from './db/models/definitions/deals';
import { IEmailTemplateDocument } from './db/models/definitions/emailTemplates';
import { IEngageMessageDocument } from './db/models/definitions/engages';
import { IFieldDocument, IFieldGroupDocument } from './db/models/definitions/fields';
import { IFormDocument } from './db/models/definitions/forms';
import { IImportHistoryDocument } from './db/models/definitions/importHistory';
import { IIntegrationDocument } from './db/models/definitions/integrations';
import { IInternalNoteDocument } from './db/models/definitions/internalNotes';
import { IArticleDocument, ICategoryDocument, ITopicDocument } from './db/models/definitions/knowledgebase';
import { IMessengerAppDocument } from './db/models/definitions/messengerApps';
import {
  IConfigDocument as INotificationConfigDocument,
  INotificationDocument,
} from './db/models/definitions/notifications';
import { IResponseTemplateDocument } from './db/models/definitions/responseTemplates';
import { ISegmentDocument } from './db/models/definitions/segments';
import { ITagDocument } from './db/models/definitions/tags';
import { IUserDocument } from './db/models/definitions/users';
import { IEmailTemplateModel, loadClass as loadEmailTemplateClass } from './db/models/EmailTemplates';
import { IEngageMessageModel, loadClass as loadEngageMessageClass } from './db/models/Engages';
import { IFieldGroupModel, IFieldModel, loadFieldClass, loadGroupClass } from './db/models/Fields';
import { IFormModel, loadClass as loadFormClass } from './db/models/Forms';
import { IImportHistoryModel, loadClass as loadImportHistoryClass } from './db/models/ImportHistory';
import { IIntegrationModel, loadClass as loadIntegrationClass } from './db/models/Integrations';
import { IInternalNoteModel, loadClass as loadInternalNoteClass } from './db/models/InternalNotes';
import {
  IKnowledgebaseArticleModel,
  IKnowledgebaseCategoryModel,
  IKnowledgebaseTopicModel,
  loadArticleClass,
  loadCategoryClass,
  loadTopicClass,
} from './db/models/KnowledgeBase';
import { IMessengerAppModel, loadClass as loadMessengerAppClass } from './db/models/MessengerApps';
import {
  INotificationConfigModel,
  INotificationModel,
  loadNotificationClass,
  loadNotificationConfigClass,
} from './db/models/Notifications';
import { IProductModel, loadClass as loadProductClass } from './db/models/Products';
import { IResponseTemplateModel, loadClass as loadResponseTemplateClass } from './db/models/ResponseTemplates';
import { ISegmentModel, loadClass as loadSegmentClass } from './db/models/Segments';
import { ISessionDocument, ISessionModel, loadClass as loadSessionClass } from './db/models/Session';
import { ITagModel, loadClass as loadTagClass } from './db/models/Tags';
import { IUserModel, loadClass as loadUserClass } from './db/models/Users';

export interface IModels {
  Brands: IBrandModel;
  Channels: IChannelModel;
  Integrations: IIntegrationModel;
  Companies: ICompanyModel;
  ActivityLogs: IActivityLogModel;
  Configs: IConfigModel;
  ConversationMessages: IConversationMessageModel;
  Conversations: IConversationModel;
  Users: IUserModel;
  Customers: ICustomerModel;
  EmailTemplates: IEmailTemplateModel;
  EngageMessages: IEngageMessageModel;
  Fields: IFieldModel;
  FieldsGroups: IFieldGroupModel;
  Forms: IFormModel;
  ImportHistory: IImportHistoryModel;
  InternalNotes: IInternalNoteModel;
  KnowledgeBaseArticles: IKnowledgebaseArticleModel;
  KnowledgeBaseCategories: IKnowledgebaseCategoryModel;
  KnowledgeBaseTopics: IKnowledgebaseTopicModel;
  MessengerApps: IMessengerAppModel;
  Notifications: INotificationModel;
  NotificationConfigurations: INotificationConfigModel;
  Products: IProductModel;
  ResponseTemplates: IResponseTemplateModel;
  Segments: ISegmentModel;
  Session: ISessionModel;
  Tags: ITagModel;
  DealBoards: IBoardModel;
  DealPipelines: IPipelineModel;
  DealStages: IStageModel;
  Deals: IDealModel;
}

export interface IContext {
  res: any;
  user: IUserDocument;
  models: IModels;
}

export const generateModels = (host = 'localhost') => {
  const MAPPING = {
    localhost: 'mongodb://localhost/erxes',
    '127.0.0.1': 'mongodb://localhost/erxes127',
  };

  if (!MAPPING[host]) {
    throw new Error('Invalid host');
  }

  const db = mongoose.createConnection(MAPPING[host]);

  // tslint:disable-next-line:no-object-literal-type-assertion
  const models: IModels = {} as IModels;

  models.Brands = db.model<IBrandDocument, IBrandModel>('brands', loadBrandClass(models));
  models.Channels = db.model<IChannelDocument, IChannelModel>('channels', loadChannelClass(models));
  models.Integrations = db.model<IIntegrationDocument, IIntegrationModel>('integrations', loadIntegrationClass(models));
  models.Companies = db.model<ICompanyDocument, ICompanyModel>('companies', loadCompanyClass(models));
  models.ActivityLogs = db.model<IActivityLogDocument, IActivityLogModel>(
    'activity_logs',
    loadActivityLogClass(models),
  );
  models.Configs = db.model<IConfigDocument, IConfigModel>('configs', loadConfigClass(models));
  models.ConversationMessages = db.model<IConversationMessageDocument, IConversationMessageModel>(
    'conversation_messages',
    loadConversationMessageClass(models),
  );
  models.Conversations = db.model<IConversationDocument, IConversationModel>(
    'conversations',
    loadConversationClass(models),
  );
  models.Users = db.model<IUserDocument, IUserModel>('users', loadUserClass(models));
  models.Customers = db.model<ICustomerDocument, ICustomerModel>('customers', loadCustomerClass(models));
  models.EmailTemplates = db.model<IEmailTemplateDocument, IEmailTemplateModel>(
    'email_templates',
    loadEmailTemplateClass(models),
  );

  models.EngageMessages = db.model<IEngageMessageDocument, IEngageMessageModel>(
    'engage_messages',
    loadEngageMessageClass(models),
  );

  models.Fields = db.model<IFieldDocument, IFieldModel>('fields', loadFieldClass(models));
  models.FieldsGroups = db.model<IFieldGroupDocument, IFieldGroupModel>('field_groups', loadGroupClass(models));
  models.Forms = db.model<IFormDocument, IFormModel>('forms', loadFormClass(models));
  models.ImportHistory = db.model<IImportHistoryDocument, IImportHistoryModel>(
    'import_histories',
    loadImportHistoryClass(models),
  );
  models.InternalNotes = db.model<IInternalNoteDocument, IInternalNoteModel>(
    'internal_notes',
    loadInternalNoteClass(models),
  );
  models.KnowledgeBaseArticles = db.model<IArticleDocument, IKnowledgebaseArticleModel>(
    'knowledgebase_articles',
    loadArticleClass(models),
  );
  models.KnowledgeBaseCategories = db.model<ICategoryDocument, IKnowledgebaseCategoryModel>(
    'knowledgebase_categories',
    loadCategoryClass(models),
  );
  models.KnowledgeBaseTopics = db.model<ITopicDocument, IKnowledgebaseTopicModel>(
    'knowledgebase_topics',
    loadTopicClass(models),
  );
  models.MessengerApps = db.model<IMessengerAppDocument, IMessengerAppModel>(
    'messenger_apps',
    loadMessengerAppClass(models),
  );
  models.Notifications = db.model<INotificationDocument, INotificationModel>(
    'notifications',
    loadNotificationClass(models),
  );
  models.NotificationConfigurations = db.model<INotificationConfigDocument, INotificationConfigModel>(
    'notification_configs',
    loadNotificationConfigClass(models),
  );
  models.Products = db.model<IProductDocument, IProductModel>('products', loadProductClass(models));
  models.ResponseTemplates = db.model<IResponseTemplateDocument, IResponseTemplateModel>(
    'response_templates',
    loadResponseTemplateClass(models),
  );
  models.Segments = db.model<ISegmentDocument, ISegmentModel>('segments', loadSegmentClass(models));
  models.Session = db.model<ISessionDocument, ISessionModel>('session', loadSessionClass());
  models.Tags = db.model<ITagDocument, ITagModel>('tags', loadTagClass(models));

  models.DealBoards = db.model<IBoardDocument, IBoardModel>('deal_boards', loadBoardClass(models));
  models.DealPipelines = db.model<IPipelineDocument, IPipelineModel>('deal_pipelines', loadPipelineClass(models));
  models.DealStages = db.model<IStageDocument, IStageModel>('deal_stages', loadStageClass(models));
  models.Deals = db.model<IDealDocument, IDealModel>('deals', loadDealClass(models));

  return models;
};
