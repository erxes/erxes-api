import { Customers, ActivityLogs } from '../models';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_PERFORMER_TYPES,
  ACTIVITY_TYPES,
  COC_CONTENT_TYPES,
} from '../models/definitions/constants';

const CustomerListeners = () =>
  Customers.watch().on('change', data => {
    const customer = data.fullDocument;

    if (data.operationType === 'insert' && customer) {
      let performer;

      if (customer.ownerId) {
        performer = {
          type: ACTIVITY_PERFORMER_TYPES.USER,
          id: customer.ownerId,
        };
      }

      let action = ACTIVITY_ACTIONS.CREATE;
      let content = `${customer.firstName || ''} ${customer.lastName || ''}`;

      if (customer.mergedIds && customer.mergedIds.length > 0) {
        action = ACTIVITY_ACTIONS.MERGE;
        content = customer.mergedIds.toString();
      }

      ActivityLogs.createDoc({
        activity: {
          type: ACTIVITY_TYPES.CUSTOMER,
          action,
          content,
          id: customer._id,
        },
        coc: {
          type: COC_CONTENT_TYPES.CUSTOMER,
          id: customer._id,
        },
        performer,
      });
    }
  });

export default CustomerListeners;
