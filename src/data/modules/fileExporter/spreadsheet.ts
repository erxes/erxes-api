import * as moment from 'moment';
import { IStageDocument } from '../../../db/models/definitions/boards';
import { IBrandDocument } from '../../../db/models/definitions/brands';
import { IIntegrationDocument } from '../../../db/models/definitions/integrations';
import { IUserGroupDocument } from '../../../db/models/definitions/permissions';
import { IPipelineLabelDocument } from '../../../db/models/definitions/pipelineLabels';
import { IUserDocument } from '../../../db/models/definitions/users';

import {
  BOARD_BASIC_INFOS,
  BRAND_BASIC_INFOS,
  CHANNEL_BASIC_INFOS,
  COMPANY_BASIC_INFOS,
  CUSTOMER_BASIC_INFOS,
  MODULE_NAMES,
  PERMISSION_BASIC_INFOS,
  USER_BASIC_INFOS,
} from '../../constants';

export const fillColumns = (itemType: string): string[] => {
  let columnNames: string[] = [];

  switch (itemType) {
    case MODULE_NAMES.COMPANY:
      columnNames = COMPANY_BASIC_INFOS;
      break;
    case MODULE_NAMES.CUSTOMER:
      columnNames = CUSTOMER_BASIC_INFOS;
      break;
    case MODULE_NAMES.DEAL:
    case MODULE_NAMES.TASK:
      columnNames = BOARD_BASIC_INFOS;
      break;
    case MODULE_NAMES.TICKET:
      columnNames = [...BOARD_BASIC_INFOS, 'source'];
      break;
    case MODULE_NAMES.USER:
      columnNames = USER_BASIC_INFOS;
      break;
    case MODULE_NAMES.BRAND:
      columnNames = BRAND_BASIC_INFOS;
      break;
    case MODULE_NAMES.CHANNEL:
      columnNames = CHANNEL_BASIC_INFOS;
      break;
    case MODULE_NAMES.PERMISSION:
      columnNames = PERMISSION_BASIC_INFOS;
      break;
    default:
      break;
  }

  return columnNames;
};

export const fillCellValue = async (colName: string, item: any): Promise<string> => {
  let cellValue: any = item[colName];

  if (typeof item[colName] === 'boolean') {
    cellValue = item[colName] ? 'Yes' : 'No';
  }

  switch (colName) {
    case 'createdAt':
    case 'closeDate':
    case 'modifiedAt':
      cellValue = moment(cellValue).format('YYYY-MM-DD HH:mm');

      break;
    case 'userId':
      const createdUser: IUserDocument = await item.getCreatedUser();

      cellValue = createdUser ? createdUser.username : 'user not found';

      break;
    // deal, task, ticket fields
    case 'assignedUserIds':
      const assignedUsers: IUserDocument[] = await item.getAssignedUsers();

      cellValue = assignedUsers.map(user => user.username).join(', ');

      break;
    case 'watchedUserIds':
      const watchedUsers: IUserDocument[] = await item.getWatchedUsers();

      cellValue = watchedUsers.map(user => user.username).join(', ');

      break;
    case 'labelIds':
      const labels: IPipelineLabelDocument[] = await item.getLabels();

      cellValue = labels.map(label => label.name).join(', ');

      break;
    case 'stageId':
      const stage: IStageDocument = await item.getStage();

      cellValue = stage ? stage.name : 'stage not found';

      break;
    case 'initialStageId':
      const initialStage: IStageDocument = await item.getInitialStage();

      cellValue = initialStage ? initialStage.name : 'stage not found';

      break;
    case 'modifiedBy':
      const modifiedBy: IUserDocument = await item.getModifiedUser();

      cellValue = modifiedBy ? modifiedBy.username : 'modified user not found';

      break;

    // user fields
    case 'brandIds':
      const brands: IBrandDocument[] = await item.getBrands();

      cellValue = brands.map(brand => brand.name).join(', ');

      break;
    case 'groupIds':
      const groups: IUserGroupDocument[] = await item.getUserGroups();

      cellValue = groups.map(g => g.name).join(', ');

      break;

    // channel fields
    case 'integrationIds':
      const integrations: IIntegrationDocument[] = await item.getIntegrations();

      cellValue = integrations.map(i => i.name).join(', ');

      break;
    case 'memberIds':
      const members: IUserDocument[] = await item.getMembers();

      cellValue = members.map(m => m.username).join(', ');

      break;

    // permission fields
    case 'groupId':
      const group: IUserGroupDocument = await item.getUsersGroup();

      cellValue = group ? group.name : 'no user group chosen';

      break;
    case 'requiredActions':
      cellValue = item.requiredActions.join(', ');

      break;
    default:
      break;
  }

  return cellValue;
};
