import { Forms } from '../../../db/models';
import { IForm } from '../../../db/models/definitions/forms';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IFormsEdit extends IForm {
  _id: string;
}

const formMutations = {
  /**
   * Create a new form
   */
  formsAdd(_root, doc: IForm, { user }: IContext) {
    return Forms.createForm(doc, user._id);
  },

  /**
   * Update form data
   */
  formsEdit(_root, { _id, ...doc }: IFormsEdit) {
    return Forms.updateForm(_id, doc);
  },
};

moduleCheckPermission(formMutations, 'manageForms');

export default formMutations;
