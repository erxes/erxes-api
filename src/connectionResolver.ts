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
import { IActivityLogDocument } from './db/models/definitions/activityLogs';
import { IBrandDocument } from './db/models/definitions/brands';
import { IChannelDocument } from './db/models/definitions/channels';
import { ICompanyDocument } from './db/models/definitions/companies';
import { IConfigDocument } from './db/models/definitions/configs';
import { IMessageDocument as IConversationMessageDocument } from './db/models/definitions/conversationMessages';
import { IConversationDocument } from './db/models/definitions/conversations';
import { ICustomerDocument } from './db/models/definitions/customers';
import { IEmailTemplateDocument } from './db/models/definitions/emailTemplates';
import { IEngageMessageDocument } from './db/models/definitions/engages';
import { IFieldDocument, IFieldGroupDocument } from './db/models/definitions/fields';
import { IFormDocument } from './db/models/definitions/forms';
import { IImportHistoryDocument } from './db/models/definitions/importHistory';
import { IIntegrationDocument } from './db/models/definitions/integrations';
import { IUserDocument } from './db/models/definitions/users';
import { IEmailTemplateModel, loadClass as loadEmailTemplateClass } from './db/models/EmailTemplates';
import { IEngageMessageModel, loadClass as loadEngageMessageClass } from './db/models/Engages';
import { IFieldGroupModel, IFieldModel, loadFieldClass, loadGroupClass } from './db/models/Fields';
import { IFormModel, loadClass as loadFormClass } from './db/models/Forms';
import { IImportHistoryModel, loadClass as loadImportHistoryClass } from './db/models/ImportHistory';
import { IIntegrationModel, loadClass as loadIntegrationClass } from './db/models/Integrations';
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
}

export interface IContext {
  user: IUserDocument;
  models: IModels;
}

export const generateModels = () => {
  const db = mongoose.createConnection('mongodb://localhost/test');

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

  return models;
};
