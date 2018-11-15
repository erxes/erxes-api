import { IContext } from '../../../connectionResolver';

export default {
  /**
   * Add conversation log
   */
  async activityLogsAddConversationLog(
    _root,
    { customerId, conversationId }: { customerId: string; conversationId: string },
    { models }: IContext,
  ) {
    const { Customers, Conversations, ActivityLogs } = models;

    const customer = await Customers.findOne({ _id: customerId });
    const conversation = await Conversations.findOne({ _id: conversationId });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!customer) {
      throw new Error('Customer not found');
    }

    return ActivityLogs.createConversationLog(conversation, customer);
  },

  /**
   * Create customer registration log for the given customer
   */
  async activityLogsAddCustomerLog(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Customers, ActivityLogs } = models;

    const customer = await Customers.findOne({ _id });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return ActivityLogs.createCustomerRegistrationLog(customer);
  },

  /**
   * Creates company registration log for the given company
   */
  async activityLogsAddCompanyLog(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Companies, ActivityLogs } = models;

    const company = await Companies.findOne({ _id });

    if (!company) {
      throw new Error('Company not found');
    }

    return ActivityLogs.createCompanyRegistrationLog(company);
  },

  /**
   * Creates deal registration log for the given deal
   */
  async activityLogsAddDealLog(_root, { _id }: { _id: string }, { models }: IContext) {
    const { Deals, ActivityLogs } = models;

    const deal = await Deals.findOne({ _id });

    if (!deal) {
      throw new Error('Deal not found');
    }

    return ActivityLogs.createDealRegistrationLog(deal);
  },
};
