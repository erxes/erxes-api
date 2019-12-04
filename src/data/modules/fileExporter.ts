import * as moment from 'moment';
import { Companies, Customers, Deals, Fields, Tasks, Tickets } from '../../db/models';
import { IUserDocument } from '../../db/models/definitions/users';
import { BOARD_BASIC_INFOS, COMPANY_BASIC_INFOS, CUSTOMER_BASIC_INFOS } from '../constants';
import { can } from '../permissions/utils';
import { createXlsFile, generateXlsx, paginate } from '../utils';
import {
  filter as companiesFilter,
  IListArgs as ICompanyListArgs,
  sortBuilder as companiesSortBuilder,
} from './coc/companies';
import {
  Builder as BuildQuery,
  IListArgs as ICustomerListArgs,
  sortBuilder as customersSortBuilder,
} from './coc/customers';

const fillCellValue = async (colName: string, item: any): Promise<string> => {
  let cellValue: any = item[colName];

  if (typeof item[colName] === 'boolean') {
    cellValue = item[colName] ? 'Yes' : 'No';
  }

  switch (colName) {
    case 'userId':
      const createdUser: IUserDocument = await item.getCreatedUser();

      cellValue = createdUser ? createdUser.username : 'user not found';

      break;
    case 'assignedUserIds':
      const assignedUsers: IUserDocument[] = await item.getAssignedUsers();

      cellValue = assignedUsers.map(user => user.username).join(', ');

      break;
    case 'watchedUserIds':
      const watchedUsers: IUserDocument[] = await item.getWatchedUsers();

      cellValue = watchedUsers.map(user => user.username).join(', ');

      break;
    case 'labelIds':
      const labels = await item.getLabels();

      cellValue = labels.map(label => label.name).join(', ');

      break;
    case 'stageId':
      const stage = await item.getStage();

      cellValue = stage ? stage.name : 'stage not found';

      break;
    case 'initialStageId':
      const initialStage = await item.getInitialStage();

      cellValue = initialStage ? initialStage.name : 'stage not found';

      break;
    case 'modifiedBy':
      const modifiedBy: IUserDocument = await item.getModifiedUser();

      cellValue = modifiedBy ? modifiedBy.username : 'modified user not found';

      break;
    case 'createdAt':
    case 'closeDate':
    case 'modifiedAt':
      cellValue = moment(cellValue).format('YYYY-MM-DD HH:mm');

      break;
    default:
      break;
  }

  return cellValue;
};

const prepareSpreadsheet = async (items: any[], itemType: string): Promise<{ name: string; response: string }> => {
  let columnNames: string[] = [];

  switch (itemType) {
    case 'company':
      columnNames = COMPANY_BASIC_INFOS;
      break;
    case 'customer':
      columnNames = CUSTOMER_BASIC_INFOS;
      break;
    case 'deal':
    case 'task':
      columnNames = BOARD_BASIC_INFOS;
      break;
    case 'ticket':
      columnNames = [...BOARD_BASIC_INFOS, 'source'];
      break;
    default:
      break;
  }

  // Reads default template
  const { workbook, sheet } = await createXlsFile();

  const cols: string[] = [];
  let rowIndex: number = 1;

  const addCell = (col: string, value: string): void => {
    // Checking if existing column
    if (cols.includes(col)) {
      // If column already exists adding cell
      sheet.cell(rowIndex, cols.indexOf(col) + 1).value(value);
    } else {
      // Creating column
      sheet.cell(1, cols.length + 1).value(col);
      // Creating cell
      sheet.cell(rowIndex, cols.length + 1).value(value);

      cols.push(col);
    }
  };

  for (const item of items) {
    rowIndex++;

    // Iterating through basic info columns
    for (const colName of columnNames) {
      if (item[colName] && item[colName] !== '') {
        const cellValue = await fillCellValue(colName, item);

        addCell(colName, cellValue);
      }
    }

    if (itemType === 'customer' || itemType === 'company') {
      // Iterating through coc custom properties
      if (item.customFieldsData) {
        const keys = Object.getOwnPropertyNames(item.customFieldsData) || [];

        for (const fieldId of keys) {
          const propertyObj = await Fields.findOne({ _id: fieldId });

          if (propertyObj && propertyObj.text) {
            addCell(propertyObj.text, item.customFieldsData[fieldId]);
          }
        }
      }
    } // customer or company checking
  } // end items for loop

  return {
    name: `${itemType} - ${moment().format('YYYY-MM-DD HH:mm')}`,
    response: await generateXlsx(workbook),
  };
};

// Exports companies to xls file
export const companiesExport = async (params: ICompanyListArgs, user: IUserDocument) => {
  if (!(await can('exportCompanies', user))) {
    throw new Error('Permission denied');
  }

  const selector = await companiesFilter(params);
  const sort = companiesSortBuilder(params);
  const companies = await paginate(Companies.find(selector), params).sort(sort);

  return prepareSpreadsheet(companies, 'company');
};

// Exports customers to xls file
export const customersExport = async (params: ICustomerListArgs, user: IUserDocument) => {
  if (!(await can('exportCustomers', user))) {
    throw new Error('Permission denied');
  }

  const qb = new BuildQuery(params);

  await qb.buildAllQueries();

  const sort = customersSortBuilder(params);

  const customers = await Customers.find(qb.mainQuery()).sort(sort);

  return prepareSpreadsheet(customers, 'customer');
};

// Exports deals into an excel file
export const dealsExport = async (user: IUserDocument) => {
  if (!(await can('exportDeals', user))) {
    throw new Error('Permission denied');
  }

  const deals = await Deals.find();

  return prepareSpreadsheet(deals, 'deal');
};

// Exports tasks into an excel file
export const tasksExport = async (user: IUserDocument) => {
  if (!(await can('exportTasks', user))) {
    throw new Error('Permission denied');
  }

  const deals = await Tasks.find();

  return prepareSpreadsheet(deals, 'task');
};

// Exports tickets into an excel file
export const ticketsExport = async (user: IUserDocument) => {
  if (!(await can('exportTickets', user))) {
    throw new Error('Permission denied');
  }

  const deals = await Tickets.find();

  return prepareSpreadsheet(deals, 'ticket');
};
