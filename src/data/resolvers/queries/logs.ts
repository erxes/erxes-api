import { brandEmailConfigSchema, brandSchema } from '../../../db/models/definitions/brands';
import { channelSchema } from '../../../db/models/definitions/channels';
import { LOG_TYPES } from '../../constants';
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
    name: LOG_TYPES.BRAND,
    schemas: [brandEmailConfigSchema, brandSchema],
  },
  {
    name: LOG_TYPES.CHANNEL,
    schemas: [channelSchema],
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
      const schemas = found.schemas || [];

      for (const schema of schemas) {
        const names: string[] = Object.getOwnPropertyNames(schema.obj);

        for (const name of names) {
          const field: any = schema.obj[name];

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
