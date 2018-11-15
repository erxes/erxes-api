import { IContext } from '../../../connectionResolver';
import { IEmailTemplate } from '../../../db/models/definitions/emailTemplates';
import { moduleRequireLogin } from '../../permissions';

interface IEmailTemplatesEdit extends IEmailTemplate {
  _id: string;
}

const emailTemplateMutations = {
  /**
   * Create new email template
   */
  emailTemplatesAdd(_root, doc: IEmailTemplate, { models }: IContext) {
    const { EmailTemplates } = models;

    return EmailTemplates.create(doc);
  },

  /**
   * Update email template
   */
  emailTemplatesEdit(_root, { _id, ...fields }: IEmailTemplatesEdit, { models }: IContext) {
    const { EmailTemplates } = models;

    return EmailTemplates.updateEmailTemplate(_id, fields);
  },

  /**
   * Delete email template
   */
  emailTemplatesRemove(_root, { _id }: { _id: string }, { models }: IContext) {
    const { EmailTemplates } = models;

    return EmailTemplates.removeEmailTemplate(_id);
  },
};

moduleRequireLogin(emailTemplateMutations);

export default emailTemplateMutations;
