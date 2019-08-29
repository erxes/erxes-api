import { Leads } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const leadQueries = {
  /**
   * Leads list
   */
  leads(_root, _args, { commonQuerySelector }: IContext) {
    return Leads.find(commonQuerySelector).sort({ title: 1 });
  },

  /**
   * Get one lead
   */
  leadDetail(_root, { _id }: { _id: string }) {
    return Leads.findOne({ _id });
  },
};

requireLogin(leadQueries, 'leadDetail');
checkPermission(leadQueries, 'leads', 'showLeads', []);

export default leadQueries;
