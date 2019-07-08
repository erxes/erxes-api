import { Customers } from '../../../db/models';

import { ICustomer } from '../../../db/models/definitions/customers';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface ICustomersEdit extends ICustomer {
  _id: string;
}

const customerMutations = {
  /**
   * Create new customer also adds Customer registration log
   */
  async customersAdd(_root, doc: ICustomer, { user }: { user: IUserDocument }) {
    const customer = await Customers.createCustomer(doc, user);

    await putLog(
      {
        type: 'customer',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(doc),
        objectId: customer._id,
        description: `${customer.firstName} has been created`,
      },
      user,
    );

    return customer;
  },

  /**
   * Update customer
   */
  async customersEdit(_root, { _id, ...doc }: ICustomersEdit, { user }: { user: IUserDocument }) {
    const customer = await Customers.findOne({ _id });
    const updated = await Customers.updateCustomer(_id, doc);

    if (customer) {
      await putLog(
        {
          type: 'customer',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(customer),
          newData: JSON.stringify(doc),
          objectId: _id,
          description: `${customer.firstName} has been updated`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Update customer Companies
   */
  async customersEditCompanies(_root, { _id, companyIds }: { _id: string; companyIds: string[] }) {
    return Customers.updateCompanies(_id, companyIds);
  },

  /**
   * Merge customers
   */
  async customersMerge(_root, { customerIds, customerFields }: { customerIds: string[]; customerFields: ICustomer }) {
    return Customers.mergeCustomers(customerIds, customerFields);
  },

  /**
   * Remove customers
   */
  async customersRemove(_root, { customerIds }: { customerIds: string[] }, { user }: { user: IUserDocument }) {
    for (const customerId of customerIds) {
      // Removing every customer and modules associated with
      const found = await Customers.findOne({ _id: customerId });
      const removed = await Customers.removeCustomer(customerId);

      if (found && removed) {
        await putLog(
          {
            type: 'customer',
            action: LOG_ACTIONS.DELETE,
            oldData: JSON.stringify(found),
            objectId: customerId,
            description: `${found.firstName} has been deleted`,
          },
          user,
        );
      }
    }

    return customerIds;
  },
};

checkPermission(customerMutations, 'customersAdd', 'customersAdd');
checkPermission(customerMutations, 'customersEdit', 'customersEdit');
checkPermission(customerMutations, 'customersEditCompanies', 'customersEditCompanies');
checkPermission(customerMutations, 'customersMerge', 'customersMerge');
checkPermission(customerMutations, 'customersRemove', 'customersRemove');

export default customerMutations;
