import { EmailTemplates } from '../../../db/models';
import { IEmailTemplate } from '../../../db/models/definitions/emailTemplates';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IEmailTemplatesEdit extends IEmailTemplate {
  _id: string;
}

const emailTemplateMutations = {
  /**
   * Create new email template
   */
  async emailTemplatesAdd(_root, doc: IEmailTemplate, { user }: { user: IUserDocument }) {
    const template = await EmailTemplates.create(doc);

    if (template) {
      await putCreateLog(
        {
          type: 'emailTemplate',
          newData: JSON.stringify(doc),
          objectId: template._id,
          description: `${template.name} has been created`,
        },
        user,
      );
    }

    return template;
  },

  /**
   * Update email template
   */
  async emailTemplatesEdit(_root, { _id, ...fields }: IEmailTemplatesEdit, { user }: { user: IUserDocument }) {
    const found = await EmailTemplates.findOne({ _id });
    const updated = await EmailTemplates.updateEmailTemplate(_id, fields);

    if (found) {
      await putUpdateLog(
        {
          type: 'emailTemplate',
          oldData: JSON.stringify(found),
          newData: JSON.stringify(fields),
          objectId: _id,
          description: `${found.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Delete email template
   */
  async emailTemplatesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const template = await EmailTemplates.findOne({ _id });
    const removed = await EmailTemplates.removeEmailTemplate(_id);

    if (template) {
      await putDeleteLog(
        {
          type: 'emailTemplate',
          oldData: JSON.stringify(template),
          objectId: _id,
          description: `${template.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(emailTemplateMutations, 'manageEmailTemplate');

export default emailTemplateMutations;
