import { FIELD_CONTENT_TYPES, FIELDS_GROUPS_CONTENT_TYPES } from '../../../data/constants';
import { Companies, Customers, Fields, FieldsGroups } from '../../../db/models';
import { debugBase } from '../../../debuggers';
import { getIndexPrefix, getMappings } from '../../../elasticsearch';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IFieldsDefaultColmns {
  [index: number]: { name: string; label: string; order: number } | {};
}

export interface IFieldsQuery {
  contentType: string;
  contentTypeId?: string;
}

/*
 * Generates fields using given schema
 */
const generateFieldsFromSchema = (queSchema: any, namePrefix: string) => {
  const queFields: any = [];

  // field definations
  const paths = queSchema.paths;

  queSchema.eachPath(name => {
    const label = paths[name].options.label;

    // add to fields list
    if (label) {
      queFields.push({
        _id: Math.random(),
        name: `${namePrefix}${name}`,
        label,
      });
    }
  });

  return queFields;
};

const fieldQueries = {
  /**
   * Fields list
   */
  fields(_root, { contentType, contentTypeId }: { contentType: string; contentTypeId: string }) {
    const query: IFieldsQuery = { contentType };

    if (contentTypeId) {
      query.contentTypeId = contentTypeId;
    }

    return Fields.find(query).sort({ order: 1 });
  },

  /**
   * Generates all field choices base on given kind.
   */
  async fieldsCombinedByContentType(_root, { contentType }: { contentType: string }) {
    let schema: any = Customers.schema;
    let fields: Array<{ _id: number; name: string; label?: string }> = [];

    if (contentType === FIELD_CONTENT_TYPES.COMPANY) {
      schema = Companies.schema;
    }

    // generate list using customer or company schema
    fields = [...fields, ...generateFieldsFromSchema(schema, '')];

    schema.eachPath(name => {
      const path = schema.paths[name];

      // extend fields list using sub schema fields
      if (path.schema) {
        fields = [...fields, ...generateFieldsFromSchema(path.schema, `${name}.`)];
      }
    });

    const customFields = await Fields.find({ contentType });

    // extend fields list using custom fields data
    for (const customField of customFields) {
      const group = await FieldsGroups.findOne({ _id: customField.groupId });

      if (group && group.isVisible && customField.isVisible) {
        fields.push({
          _id: Math.random(),
          name: `customFieldsData.${customField._id}`,
          label: customField.text,
        });
      }
    }

    let mappingProperties: any = {};

    // extend fields list using tracked fields data
    try {
      const index = `${getIndexPrefix()}${contentType === 'company' ? 'companies' : 'customers'}`;
      const response = await getMappings(index);
      mappingProperties = response[index].mappings.properties;
    } catch (e) {
      debugBase(`Error occurred in fieldsCombinedByContentType ${e.message}`);
    }

    if (mappingProperties.trackedData) {
      const trackedDataFields = Object.keys(mappingProperties.trackedData.properties || {});

      for (const trackedDataField of trackedDataFields) {
        fields.push({
          _id: Math.random(),
          name: `trackedData.${trackedDataField}`,
          label: trackedDataField,
        });
      }
    }

    return fields;
  },

  /**
   * Default list columns config
   */
  fieldsDefaultColumnsConfig(_root, { contentType }: { contentType: string }): IFieldsDefaultColmns {
    if (contentType === FIELD_CONTENT_TYPES.COMPANY) {
      return [
        { name: 'primaryName', label: 'Primary Name', order: 1 },
        { name: 'size', label: 'Size', order: 2 },
        { name: 'links.website', label: 'Website', order: 3 },
        { name: 'industry', label: 'Industry', order: 4 },
        { name: 'plan', label: 'Plan', order: 5 },
        { name: 'lastSeenAt', label: 'Last seen at', order: 6 },
        { name: 'sessionCount', label: 'Session count', order: 7 },
      ];
    }

    return [
      { name: 'firstName', label: 'First name', order: 1 },
      { name: 'lastName', label: 'Last name', order: 1 },
      { name: 'primaryEmail', label: 'Primary email', order: 2 },
      { name: 'primaryPhone', label: 'Primary phone', order: 3 },
    ];
  },
};

requireLogin(fieldQueries, 'fieldsCombinedByContentType');
requireLogin(fieldQueries, 'fieldsDefaultColumnsConfig');

checkPermission(fieldQueries, 'fields', 'showForms', []);

const fieldsGroupQueries = {
  /**
   * Fields group list
   */
  fieldsGroups(_root, { contentType }: { contentType: string }, { commonQuerySelector }: IContext) {
    const query: any = commonQuerySelector;

    // querying by content type
    query.contentType = contentType || FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER;

    return FieldsGroups.find(query).sort({ order: 1 });
  },
};

checkPermission(fieldsGroupQueries, 'fieldsGroups', 'showForms', []);

export { fieldQueries, fieldsGroupQueries };
