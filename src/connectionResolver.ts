import * as mongoose from 'mongoose';
import { IBrandModel, loadClass as loadBrandClass } from './db/models/Brands';
import { IChannelModel, loadClass as loadChannelClass } from './db/models/Channels';
import { IBrandDocument } from './db/models/definitions/brands';
import { IChannelDocument } from './db/models/definitions/channels';
import { IIntegrationDocument } from './db/models/definitions/integrations';
import { IUserDocument } from './db/models/definitions/users';
import { IIntegrationModel, loadClass as loadIntegrationClass } from './db/models/Integrations';

export interface IModels {
  Brands: IBrandModel;
  Channels: IChannelModel;
  Integrations: IIntegrationModel;
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

  return models;
};
