import { Forms, FormSubmissions } from '../../../db/models';
import { IForm } from '../../../db/models/definitions/forms';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IFormsEdit extends IForm {
  _id: string;
}

interface IFormSubmission {
  contentType: string;
  formSubmissions: JSON;
  formId: string;
}

const formMutations = {
  /**
   * Create a new form
   */
  formsAdd(_root, doc: IForm, { user, docModifier }: IContext) {
    return Forms.createForm(docModifier(doc), user._id);
  },

  /**
   * Update a form data
   */
  formsEdit(_root, { _id, ...doc }: IFormsEdit, { docModifier }: IContext) {
    return Forms.updateForm(_id, docModifier(doc));
  },

  /**
   * Create a form submission data
   */
  async formSubmissionsSave(
    _root,
    { formId, contentType, formSubmissions }: IFormSubmission,
    { docModifier }: IContext,
  ) {
    for (const key of Object.keys(formSubmissions)) {
      const formSubmission = await FormSubmissions.findOne({ formId, contentType });

      if (formSubmission) {
        formSubmission.value = formSubmissions[key];

        formSubmission.save();
      } else {
        const created = {
          contentTypeId: key,
          contentType,
          formId,
          value: formSubmissions[key],
        };

        FormSubmissions.createFormSubmission(docModifier(created));
      }
    }

    return true;
  },
};

moduleCheckPermission(formMutations, 'manageForms');

export default formMutations;
