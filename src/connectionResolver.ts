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
import { IActivityLogDocument } from './db/models/definitions/activityLogs';
import { IBrandDocument } from './db/models/definitions/brands';
import { IChannelDocument } from './db/models/definitions/channels';
import { ICompanyDocument } from './db/models/definitions/companies';
import { IConfigDocument } from './db/models/definitions/configs';
import { IMessageDocument as IConversationMessageDocument } from './db/models/definitions/conversationMessages';
import { IConversationDocument } from './db/models/definitions/conversations';
import { IIntegrationDocument } from './db/models/definitions/integrations';
import { IUserDocument } from './db/models/definitions/users';
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

  return models;
};
