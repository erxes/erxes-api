import * as mongoose from 'mongoose';
import { IBrandModel, loadClass } from './db/models/Brands';
import { IBrandDocument } from './db/models/definitions/brands';
import { IUserDocument } from './db/models/definitions/users';

export interface IModels {
  Brands: IBrandModel;
}

export interface IContext {
  user: IUserDocument;
  models: IModels;
}

export const generateModels = () => {
  const db = mongoose.createConnection('mongodb://localhost/test');

  // tslint:disable-next-line:no-object-literal-type-assertion
  const models: IModels = {} as IModels;

  models.Brands = db.model<IBrandDocument, IBrandModel>('brands', loadClass(models));

  return models;
};
