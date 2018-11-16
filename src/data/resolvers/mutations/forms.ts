import { IContext } from '../../../connectionResolver';
import { IForm } from '../../../db/models/definitions/forms';
import { requireAdmin } from '../../permissions';

interface IFormsEdit extends IForm {
  _id: string;
}

const formMutations = {
  /**
   * Create a new form
   */
  formsAdd(_root, doc: IForm, { user, models: { Forms } }: IContext) {
    return Forms.createForm(doc, user._id);
  },

  /**
   * Update form data
   */
  formsEdit(_root, { _id, ...doc }: IFormsEdit, { models: { Forms } }: IContext) {
    return Forms.updateForm(_id, doc);
  },
};

requireAdmin(formMutations, 'formsAdd');
requireAdmin(formMutations, 'formsEdit');

export default formMutations;
