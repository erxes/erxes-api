import { Companies, ActivityLogs } from '../models';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_PERFORMER_TYPES,
  ACTIVITY_TYPES,
  COC_CONTENT_TYPES,
} from '../models/definitions/constants';

const CompanyListeners = () =>
  Companies.watch().on('change', data => {
    const company = data.fullDocument;

    if (data.operationType === 'insert' && company) {
      let performer;

      if (company.ownerId) {
        performer = {
          type: ACTIVITY_PERFORMER_TYPES.USER,
          id: company.ownerId,
        };
      }

      let action = ACTIVITY_ACTIONS.CREATE;
      let content = company.primaryName || '';

      if (company.mergedIds && company.mergedIds.length > 0) {
        action = ACTIVITY_ACTIONS.MERGE;
        content = company.mergedIds.toString();
      }

      ActivityLogs.createDoc({
        activity: {
          type: ACTIVITY_TYPES.COMPANY,
          action,
          content,
          id: company._id,
        },
        coc: {
          type: COC_CONTENT_TYPES.COMPANY,
          id: company._id,
        },
        performer,
      });
    }
  });

export default CompanyListeners;
