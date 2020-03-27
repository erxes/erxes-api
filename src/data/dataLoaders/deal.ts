import * as DataLoader from 'DataLoader';
import * as _ from 'lodash';
import { Companies, Conformities, Customers, PipelineLabels, Pipelines, Stages, Users } from '../../db/models';
import { IPipeline, IStage } from '../../db/models/definitions/boards';
import { ICompany } from '../../db/models/definitions/companies';
import { ICustomer } from '../../db/models/definitions/customers';
import { IPipelineLabel } from '../../db/models/definitions/pipelineLabels';
import { IUser } from '../../db/models/definitions/users';

const groupByIds = (listObject, ids: string[]) => {
  return listObject.filter(obj => ids.includes(obj._id));
};

const batchLabels = async labelIds => {
  const pipelines: IPipeline[][] = [];

  const labels = await PipelineLabels.find({ _id: { $in: _.flattenDeep(labelIds) } });

  for (const ids of labelIds) {
    pipelines.push(groupByIds(labels, ids));
  }

  return pipelines;
};

const batchAssignedUsers = async userIds => {
  const assignedUsers: IUser[][] = [];

  const users = await Users.find({ _id: { $in: _.flattenDeep(userIds) } });

  for (const ids of userIds) {
    assignedUsers.push(groupByIds(users, ids));
  }

  return assignedUsers;
};

const batchCompanies = async dealIds => {
  const companies: ICompany[][] = [];
  const allCompanyIds: string[][] = [];

  for (const dealId of dealIds) {
    allCompanyIds.push(
      await Conformities.savedConformity({
        mainType: 'deal',
        mainTypeId: dealId,
        relTypes: ['company'],
      }),
    );
  }

  const allCompanies = await Companies.find({ _id: { $in: _.flattenDeep(allCompanyIds) } });

  for (const comapnyIds of allCompanyIds) {
    companies.push(groupByIds(allCompanies, comapnyIds));
  }

  return dealIds.map((_, idx) => companies[idx]);
};

const batchCustomers = async dealIds => {
  const customers: ICustomer[][] = [];
  const allCustomerIds: string[][] = [];

  for (const dealId of dealIds) {
    allCustomerIds.push(
      await Conformities.savedConformity({
        mainType: 'deal',
        mainTypeId: dealId,
        relTypes: ['customer'],
      }),
    );
  }

  const allCustomers = await Customers.find({ _id: { $in: _.flattenDeep(allCustomerIds) } });

  for (const customerIds of allCustomerIds) {
    customers.push(groupByIds(allCustomers, customerIds));
  }

  return dealIds.map((_, idx) => customers[idx]);
};

const batchPipelines = async stageIds => {
  const stages = await Stages.find({ _id: { $in: stageIds } });

  const pipelineIds = stages.map(stage => stage.pipelineId);
  const pipelines = await Pipelines.find({ _id: { $in: pipelineIds } });

  return stageIds.map((_, idx) => pipelines[idx]);
};

const batchUsers = async userIds => {
  const users = await Users.find({ _id: { $in: userIds } });

  const userMap = {};

  users.map(user => {
    userMap[user._id] = user;
  });

  return userIds.map(id => userMap[id]);
};

const batchStage = async stageIds => {
  const stages = await Stages.find({ _id: { $in: stageIds } });

  const stageMap = {};

  stages.map(stage => {
    stageMap[stage._id] = stage;
  });

  return stageIds.map(id => stageMap[id]);
};

const pipelineLabelsLoader = () => new DataLoader<string[], IPipelineLabel[]>(batchLabels as any);
const pipelineLoader = () => new DataLoader<string, IPipeline[]>(batchPipelines);

const assignedUsersLoader = () => new DataLoader<string[], IUser[]>(batchAssignedUsers);
const userLoader = () => new DataLoader<string, IPipeline[]>(batchUsers);

const customersLoader = () => new DataLoader<string, ICustomer[]>(batchCustomers);
const companiesLoader = () => new DataLoader<string, ICustomer[]>(batchCompanies);

const stageLoader = () => new DataLoader<string, IStage>(batchStage);

export {
  pipelineLabelsLoader,
  pipelineLoader,
  userLoader,
  assignedUsersLoader,
  customersLoader,
  companiesLoader,
  stageLoader,
};
