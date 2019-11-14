import { FIELD_CONTENT_TYPES, FIELDS_GROUPS_CONTENT_TYPES, INTEGRATION_KIND_CHOICES } from '../../../data/constants';
import { Brands, Companies, Customers, Fields, FieldsGroups, Integrations } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

export interface IFieldsQuery {
  contentType: string;
  contentTypeId?: string;
}

interface IfieldsDefaultColmns {
  [index: number]: { name: string; label: string; order: number } | {};
}

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
   * For example if kind is customer
   * then it will generate customer related fields
   * [{ name: 'messengerData.isActive', text: 'Messenger: is Active' }]
   */
  async fieldsCombinedByContentType(_root, { contentType }: { contentType: string }) {
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

    let schema: any = Companies.schema;
    let fields: Array<{ _id: number; name: string; label?: string; brandName?: string; brandId?: string }> = [];

    if (contentType === FIELD_CONTENT_TYPES.CUSTOMER) {
      const messengerIntegrations = await Integrations.findIntegrations({
        kind: INTEGRATION_KIND_CHOICES.MESSENGER,
      });

      // generate messengerData.customData fields
      for (const integration of messengerIntegrations) {
        const brand = await Brands.findOne({ _id: integration.brandId });

        const lastCustomers = await Customers.find({
          integrationId: integration._id,
          $and: [
            { 'messengerData.customData': { $exists: true } },
            { 'messengerData.customData': { $ne: null } },
            { 'messengerData.customData': { $ne: {} } },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1);

        if (brand && integration && lastCustomers.length > 0) {
          const [lastCustomer] = lastCustomers;

          if (lastCustomer.messengerData) {
            const customDataFields = Object.keys(lastCustomer.messengerData.customData || {});

            for (const customDataField of customDataFields) {
              fields.push({
                _id: Math.random(),
                name: `messengerData.customData.${customDataField}`,
                label: customDataField,
                brandName: brand.name,
                brandId: brand._id,
              });
            }
          }
        }
      }

      schema = Customers.schema;
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

    // extend fields list using custom fields
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

    return fields;
  },

  /**
   * Default list columns config
   */
  fieldsDefaultColumnsConfig(_root, { contentType }: { contentType: string }): IfieldsDefaultColmns {
    if (contentType === FIELD_CONTENT_TYPES.CUSTOMER) {
      return [
        { name: 'firstName', label: 'First name', order: 1 },
        { name: 'lastName', label: 'Last name', order: 1 },
        { name: 'primaryEmail', label: 'Primary email', order: 2 },
        { name: 'primaryPhone', label: 'Primary phone', order: 3 },
      ];
    }

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

    return [];
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
