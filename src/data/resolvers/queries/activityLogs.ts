import { IContext } from '../../../connectionResolver';
import { moduleRequireLogin } from '../../permissions';
import {
  CompanyMonthActivityLogBuilder,
  CustomerMonthActivityLogBuilder,
  DealMonthActivityLogBuilder,
  UserMonthActivityLogBuilder,
} from './activityLogUtils';

const activityLogQueries = {
  /**
   * Get activity log for customer
   */
  async activityLogsCustomer(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Customers } = models;

    const customer = await Customers.findOne({ _id });

    const customerMonthActivityLogBuilder = new CustomerMonthActivityLogBuilder(customer);
    return customerMonthActivityLogBuilder.build();
  },

  /**
   * Get activity log for company
   */
  async activityLogsCompany(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Companies } = models;

    const company = await Companies.findOne({ _id });

    const companyMonthActivityLogBuilder = new CompanyMonthActivityLogBuilder(company);
    return companyMonthActivityLogBuilder.build();
  },

  /**
   * Get activity logs for user
   */
  async activityLogsUser(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Users } = models;

    const user = await Users.findOne({ _id });

    const userMonthActivityLogBuilder = new UserMonthActivityLogBuilder(user);
    return userMonthActivityLogBuilder.build();
  },

  /**
   * Get activity logs for deal
   */
  async activityLogsDeal(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Deals } = models;

    const deal = await Deals.findOne({ _id });

    const dealMonthActivityLogBuilder = new DealMonthActivityLogBuilder(deal);
    return dealMonthActivityLogBuilder.build();
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
