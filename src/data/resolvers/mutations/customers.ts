import { IContext } from '../../../connectionResolver';
import { ICustomer } from '../../../db/models/definitions/customers';
import { moduleRequireLogin } from '../../permissions';

interface ICustomersEdit extends ICustomer {
  _id: string;
}

const customerMutations = {
  /*
   * Create new customer also adds Customer registration log
   */
  async customersAdd(_root, doc: ICustomer, { user, models }: IContext) {
    const { Customers, ActivityLogs } = models;

    const customer = await Customers.createCustomer(doc, user);

    await ActivityLogs.createCustomerRegistrationLog(customer, user);

    return customer;
  },

  /**
   * Update customer
   */
  async customersEdit(_root, { _id, ...doc }: ICustomersEdit, { models }: IContext) {
    const { Customers } = models;
    return Customers.updateCustomer(_id, doc);
  },

  /**
   * Update customer Companies
   */
  async customersEditCompanies(
    _root,
    { _id, companyIds }: { _id: string; companyIds: string[] },
    { models }: IContext,
  ) {
    const { Customers } = models;
    return Customers.updateCompanies(_id, companyIds);
  },

  /**
   * Merge customers
   */
  async customersMerge(
    _root,
    { customerIds, customerFields }: { customerIds: string[]; customerFields: ICustomer },
    { models }: IContext,
  ) {
    const { Customers } = models;
    return Customers.mergeCustomers(customerIds, customerFields);
  },

  /**
   * Remove customers
   */
  async customersRemove(_root, { customerIds }: { customerIds: string[] }, { models }: IContext) {
    const { Customers } = models;

    for (const customerId of customerIds) {
      // Removing every customer and modules associated with
      await Customers.removeCustomer(customerId);
    }

    return customerIds;
  },
};

moduleRequireLogin(customerMutations);

export default customerMutations;
