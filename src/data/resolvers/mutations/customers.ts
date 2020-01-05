import { ActivityLogs, Customers } from '../../../db/models';
import { ICustomer } from '../../../db/models/definitions/customers';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherCustomerNames, gatherIntegrationNames, gatherTagNames, gatherUsernames, LogDesc } from './logUtils';

interface ICustomersEdit extends ICustomer {
  _id: string;
}

const customerMutations = {
  /**
   * Create new customer also adds Customer registration log
   */
  async customersAdd(_root, doc: ICustomer, { user, docModifier }: IContext) {
    const modifiedDoc = docModifier(doc);
    const customer = await Customers.createCustomer(modifiedDoc, user);

    let extraDesc: LogDesc[] = [];

    if (doc.ownerId) {
      extraDesc = await gatherUsernames({
        idFields: [doc.ownerId],
        foreignKey: 'ownerId',
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.CUSTOMER,
        newData: JSON.stringify(modifiedDoc),
        object: customer,
        description: `"${customer.firstName}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return customer;
  },

  /**
   * Updates a customer
   */
  async customersEdit(_root, { _id, ...doc }: ICustomersEdit, { user }: IContext) {
    const customer = await Customers.getCustomer(_id);
    const updated = await Customers.updateCustomer(_id, doc);

    const ownerIds: string[] = [];
    let extraDesc: LogDesc[] = [];

    if (customer.ownerId) {
      ownerIds.push(customer.ownerId);
    }

    if (doc.ownerId && doc.ownerId !== customer.ownerId) {
      ownerIds.push(doc.ownerId);
    }

    if (ownerIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: ownerIds,
        foreignKey: 'ownerId',
      });
    }

    if (customer.tagIds && customer.tagIds.length > 0) {
      extraDesc = await gatherTagNames({
        idFields: customer.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    if (customer.integrationId) {
      extraDesc = await gatherIntegrationNames({
        idFields: [customer.integrationId],
        foreignKey: 'integrationId',
        prevList: extraDesc,
      });
    }

    if (customer.mergedIds) {
      extraDesc = await gatherCustomerNames({
        idFields: customer.mergedIds,
        foreignKey: 'mergedIds',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.CUSTOMER,
        object: customer,
        newData: JSON.stringify(doc),
        description: `"${customer.firstName || doc.firstName}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Merge customers
   */
  async customersMerge(
    _root,
    { customerIds, customerFields }: { customerIds: string[]; customerFields: ICustomer },
    { user }: IContext,
  ) {
    return Customers.mergeCustomers(customerIds, customerFields, user);
  },

  /**
   * Remove customers
   */
  async customersRemove(_root, { customerIds }: { customerIds: string[] }, { user }: IContext) {
    const customers = await Customers.find({ _id: { $in: customerIds } }).lean();

    await Customers.removeCustomers(customerIds);

    for (const customer of customers) {
      await ActivityLogs.removeActivityLog(customer._id);

      let extraDesc: LogDesc[] = [];

      if (customer.ownerId) {
        extraDesc = await gatherUsernames({ idFields: [customer.ownerId], foreignKey: 'ownerId ' });
      }

      if (customer.integrationId) {
        extraDesc = await gatherIntegrationNames({
          idFields: [customer.integrationId],
          foreignKey: 'integrationId',
          prevList: extraDesc,
        });
      }

      await putDeleteLog(
        {
          type: MODULE_NAMES.CUSTOMER,
          object: customer,
          description: `"${customer.firstName}" has been deleted`,
          extraDesc: JSON.stringify(extraDesc),
        },
        user,
      );
    }

    return customerIds;
  },
};

checkPermission(customerMutations, 'customersAdd', 'customersAdd');
checkPermission(customerMutations, 'customersEdit', 'customersEdit');
checkPermission(customerMutations, 'customersMerge', 'customersMerge');
checkPermission(customerMutations, 'customersRemove', 'customersRemove');

export default customerMutations;
