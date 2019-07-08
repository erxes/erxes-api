import { ResponseTemplates } from '../../../db/models';
import { IResponseTemplate } from '../../../db/models/definitions/responseTemplates';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IResponseTemplatesEdit extends IResponseTemplate {
  _id: string;
}

const responseTemplateMutations = {
  /**
   * Create new response template
   */
  async responseTemplatesAdd(_root, doc: IResponseTemplate, { user }: { user: IUserDocument }) {
    const template = await ResponseTemplates.create(doc);

    if (template) {
      await putCreateLog(
        {
          type: 'responseTemplate',
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
   * Update response template
   */
  async responseTemplatesEdit(_root, { _id, ...fields }: IResponseTemplatesEdit, { user }: { user: IUserDocument }) {
    const found = await ResponseTemplates.findOne({ _id });
    const updated = await ResponseTemplates.updateResponseTemplate(_id, fields);

    if (found) {
      await putUpdateLog(
        {
          type: 'responseTemplate',
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
   * Delete response template
   */
  async responseTemplatesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const template = await ResponseTemplates.findOne({ _id });
    const removed = await ResponseTemplates.removeResponseTemplate(_id);

    if (template) {
      await putDeleteLog(
        {
          type: 'responseTemplate',
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

moduleCheckPermission(responseTemplateMutations, 'manageResponseTemplate');

export default responseTemplateMutations;
