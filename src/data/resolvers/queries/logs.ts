import {
  attachmentSchema,
  boardSchema,
  commonItemFieldsSchema,
  pipelineSchema,
} from '../../../db/models/definitions/boards';
import { brandEmailConfigSchema, brandSchema } from '../../../db/models/definitions/brands';
import { channelSchema } from '../../../db/models/definitions/channels';
import { checklistItemSchema, checklistSchema } from '../../../db/models/definitions/checklists';
import { companySchema, linkSchema } from '../../../db/models/definitions/companies';
import { customerSchema, locationSchema } from '../../../db/models/definitions/customers';
import {
  dealSchema,
  productCategorySchema,
  productDataSchema,
  productSchema,
} from '../../../db/models/definitions/deals';
import { emailTemplateSchema } from '../../../db/models/definitions/emailTemplates';
import { importHistorySchema } from '../../../db/models/definitions/importHistory';
import { articleSchema, categorySchema, topicSchema } from '../../../db/models/definitions/knowledgebase';
import { permissionSchema, userGroupSchema } from '../../../db/models/definitions/permissions';
import { responseTemplateSchema } from '../../../db/models/definitions/responseTemplates';
import { tagSchema } from '../../../db/models/definitions/tags';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { fetchLogs, ILogQueryParams } from '../../utils';

interface INameLabel {
  name: string;
  label: string;
}

interface ISchemaMap {
  name: string;
  schemas: any[];
}

const LOG_MAPPINGS: ISchemaMap[] = [
  {
    name: MODULE_NAMES.BOARD_DEAL,
    schemas: [attachmentSchema, boardSchema],
  },
  {
    name: MODULE_NAMES.BOARD_TASK,
    schemas: [attachmentSchema, boardSchema],
  },
  {
    name: MODULE_NAMES.BOARD_TICKET,
    schemas: [attachmentSchema, boardSchema],
  },
  {
    name: MODULE_NAMES.PIPELINE_DEAL,
    schemas: [pipelineSchema],
  },
  {
    name: MODULE_NAMES.PIPELINE_TASK,
    schemas: [pipelineSchema],
  },
  {
    name: MODULE_NAMES.PIPELINE_TICKET,
    schemas: [pipelineSchema],
  },
  {
    name: MODULE_NAMES.BRAND,
    schemas: [brandEmailConfigSchema, brandSchema],
  },
  {
    name: MODULE_NAMES.CHANNEL,
    schemas: [channelSchema],
  },
  {
    name: MODULE_NAMES.CHECKLIST,
    schemas: [checklistSchema],
  },
  {
    name: MODULE_NAMES.CHECKLIST_ITEM,
    schemas: [checklistItemSchema],
  },
  {
    name: MODULE_NAMES.COMPANY,
    schemas: [companySchema, linkSchema],
  },
  {
    name: MODULE_NAMES.CUSTOMER,
    schemas: [customerSchema, locationSchema],
  },
  {
    name: MODULE_NAMES.DEAL,
    schemas: [commonItemFieldsSchema, dealSchema, productDataSchema],
  },
  {
    name: MODULE_NAMES.EMAIL_TEMPLATE,
    schemas: [emailTemplateSchema],
  },
  {
    name: MODULE_NAMES.IMPORT_HISTORY,
    schemas: [importHistorySchema],
  },
  {
    name: MODULE_NAMES.TAG,
    schemas: [tagSchema],
  },
  {
    name: MODULE_NAMES.RESPONSE_TEMPLATE,
    schemas: [responseTemplateSchema],
  },
  {
    name: MODULE_NAMES.PRODUCT,
    schemas: [productSchema, tagSchema],
  },
  {
    name: MODULE_NAMES.PRODUCT_CATEGORY,
    schemas: [productCategorySchema],
  },
  {
    name: MODULE_NAMES.KB_TOPIC,
    schemas: [topicSchema],
  },
  {
    name: MODULE_NAMES.KB_CATEGORY,
    schemas: [categorySchema],
  },
  {
    name: MODULE_NAMES.KB_ARTICLE,
    schemas: [articleSchema],
  },
  {
    name: MODULE_NAMES.PERMISSION,
    schemas: [permissionSchema],
  },
  {
    name: MODULE_NAMES.USER_GROUP,
    schemas: [userGroupSchema],
  },
];

/**
 * Creates field name-label mapping list from given object
 */
const buildLabelList = (obj = {}): INameLabel[] => {
  const list: INameLabel[] = [];
  const fieldNames: string[] = Object.getOwnPropertyNames(obj);

  for (const name of fieldNames) {
    const field: any = obj[name];
    const label: string = field && field.label ? field.label : '';

    list.push({ name, label });
  }

  return list;
};

const logQueries = {
  /**
   * Fetches logs from logs api server
   */
  logs(_root, params: ILogQueryParams) {
    const { start, end, userId, action, page, perPage } = params;

    return fetchLogs({
      start,
      end,
      userId,
      action,
      page,
      perPage,
    });
  },
  async getDbSchemaLabels(_root, params: { type: string }) {
    let fieldNames: INameLabel[] = [];

    const found: ISchemaMap | undefined = LOG_MAPPINGS.find(m => m.name === params.type);

    if (found) {
      const schemas: any = found.schemas || [];

      for (const schema of schemas) {
        // schema comes as either mongoose schema or plain object
        const names: string[] = Object.getOwnPropertyNames(schema.obj || schema);

        for (const name of names) {
          const field: any = schema.obj ? schema.obj[name] : schema[name];

          if (field && field.label) {
            fieldNames.push({ name, label: field.label });
          }

          // nested object field names
          if (typeof field === 'object' && field.type && field.type.obj) {
            fieldNames = fieldNames.concat(buildLabelList(field.type.obj));
          }
        }
      } // end schema for loop
    } // end schema name mapping

    return fieldNames;
  },
};

checkPermission(logQueries, 'logs', 'viewLogs');

export default logQueries;
