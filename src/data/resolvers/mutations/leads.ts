import { Leads } from '../../../db/models';
import { ILead } from '../../../db/models/definitions/leads';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ILeadsEdit extends ILead {
  _id: string;
}

const leadMutations = {
  /**
   * Create a new lead
   */
  leadsAdd(_root, doc: ILead, { user, docModifier }: IContext) {
    return Leads.createLead(docModifier(doc), user._id);
  },

  /**
   * Update lead data
   */
  leadsEdit(_root, { _id, ...doc }: ILeadsEdit, { docModifier }: IContext) {
    return Leads.updateLead(_id, docModifier(doc));
  },
};

moduleCheckPermission(leadMutations, 'manageLeads');

export default leadMutations;
