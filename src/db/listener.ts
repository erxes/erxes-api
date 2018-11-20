import { publishClientMessage, publishMessage } from '../data/resolvers/mutations/conversations';
import { connect } from './connection';
import { ActivityLogs, Companies, ConversationMessages, Conversations, Customers } from './models';

export const listenChangeConversation = async () => {
  try {
    await connect();

    ConversationMessages.watch().on('change', data => {
      const message = data.fullDocument;

      if (data.operationType === 'insert' && message) {
        publishClientMessage(message);
        publishMessage(message);
      }
    });

    Conversations.watch().on('change', async data => {
      const conversation = data.fullDocument;

      if (data.operationType === 'insert' && conversation) {
        const customer = await Customers.findOne({ _id: conversation.customerId });
        if (customer) {
          ActivityLogs.createConversationLog(conversation, customer);
        }
      }
    });

    Customers.watch().on('change', data => {
      const customer = data.fullDocument;

      if (data.operationType === 'insert' && customer) {
        ActivityLogs.createCustomerRegistrationLog(customer);
      }
    });

    Companies.watch().on('change', data => {
      const company = data.fullDocument;

      if (data.operationType === 'insert' && company) {
        ActivityLogs.createCompanyRegistrationLog(company);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
