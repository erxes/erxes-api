import { connect } from '../connection';

import ConversationListeners from './Conversations';
import CustomerListeners from './Customers';
import CompanyListeners from './Companies';
import InternalNoteListeners from './InternalNotes';
import DealListeners from './Deals';
import EmailDeliveryListeners from './EmailDeliveries';

export const listen = async () => {
  try {
    await connect();

    ConversationListeners();

    CompanyListeners();

    CustomerListeners();

    InternalNoteListeners();

    DealListeners();

    EmailDeliveryListeners();
  } catch (error) {
    console.log(error);
  }
};
