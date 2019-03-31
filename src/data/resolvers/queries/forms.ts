import { Forms } from '../../../db/models';
import { checkPermission } from '../../permissions';

const formQueries = {
  /**
   * Forms list
   */
  forms() {
    return Forms.find({}).sort({ title: 1 });
  },

  /**
   * Get one form
   */
  formDetail(_root, { _id }: { _id: string }) {
    return Forms.findOne({ _id });
  },
};

checkPermission(formQueries, 'forms', 'showForms');
checkPermission(formQueries, 'formDetail', 'showFormDetail');

export default formQueries;
