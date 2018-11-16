import { IContext } from '../../../connectionResolver';
import { IResponseTemplate } from '../../../db/models/definitions/responseTemplates';
import { moduleRequireLogin } from '../../permissions';

interface IResponseTemplatesEdit extends IResponseTemplate {
  _id: string;
}

const responseTemplateMutations = {
  /**
   * Create new response template
   */
  responseTemplatesAdd(_root, doc: IResponseTemplate, { models: { ResponseTemplates } }: IContext) {
    return ResponseTemplates.create(doc);
  },

  /**
   * Update response template
   */
  responseTemplatesEdit(
    _root,
    { _id, ...fields }: IResponseTemplatesEdit,
    { models: { ResponseTemplates } }: IContext,
  ) {
    return ResponseTemplates.updateResponseTemplate(_id, fields);
  },

  /**
   * Delete response template
   */
  responseTemplatesRemove(_root, { _id }: { _id: string }, { models: { ResponseTemplates } }: IContext) {
    return ResponseTemplates.removeResponseTemplate(_id);
  },
};

moduleRequireLogin(responseTemplateMutations);

export default responseTemplateMutations;
