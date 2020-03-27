import * as express from 'express';
import { IUserDocument } from '../db/models/definitions/users';
import {
  assignedUsersLoader,
  companiesLoader,
  customersLoader,
  pipelineLabelsLoader,
  pipelineLoader,
  stageLoader,
  userLoader,
} from './dataLoaders/deal';

export interface IContext {
  res: express.Response;
  requestInfo: any;
  user: IUserDocument;
  docModifier: <T>(doc: T) => any;
  loaders: {
    dealLoaders: {
      pipelineLabelsLoader: ReturnType<typeof pipelineLabelsLoader>;
      pipelineLoader: ReturnType<typeof pipelineLoader>;
      assignedUsersLoader: ReturnType<typeof assignedUsersLoader>;
      userLoader: ReturnType<typeof userLoader>;
      customersLoader: ReturnType<typeof customersLoader>;
      companiesLoader: ReturnType<typeof companiesLoader>;
      stageLoader: ReturnType<typeof stageLoader>;
    };
  };
  brandIdSelector: {};
  userBrandIdsSelector: {};
  commonQuerySelector: {};
  commonQuerySelectorElk: {};
  dataSources: {
    EngagesAPI: any;
    IntegrationsAPI: any;
  };
}
