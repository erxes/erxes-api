import { ResponseTemplates } from '../../../db/models';
import { IResponseTemplate } from '../../../db/models/definitions/responseTemplates';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherBrandNames, LogDesc } from './logUtils';

interface IResponseTemplatesEdit extends IResponseTemplate {
  _id: string;
}

const responseTemplateMutations = {
  /**
   * Creates a new response template
   */
  async responseTemplatesAdd(_root, doc: IResponseTemplate, { user, docModifier }: IContext) {
    const template = await ResponseTemplates.create(docModifier(doc));

    let extraDesc: LogDesc[] = [];

    if (doc.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [doc.brandId],
        foreignKey: 'brandId',
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.RESPONSE_TEMPLATE,
        newData: doc,
        object: template,
        description: `"${template.name}" has been created`,
        extraDesc,
      },
      user,
    );

    return template;
  },

  /**
   * Updates a response template
   */
  async responseTemplatesEdit(_root, { _id, ...fields }: IResponseTemplatesEdit, { user }: IContext) {
    const template = await ResponseTemplates.getResponseTemplate(_id);
    const updated = await ResponseTemplates.updateResponseTemplate(_id, fields);

    const brandIds: string[] = [];
    let extraDesc: LogDesc[] = [];

    if (template.brandId) {
      brandIds.push(template.brandId);
    }

    if (fields.brandId && fields.brandId !== template.brandId) {
      brandIds.push(fields.brandId);
    }

    if (brandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: brandIds,
        foreignKey: 'brandId',
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.RESPONSE_TEMPLATE,
        object: template,
        newData: fields,
        description: `"${template.name}" has been edited`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Deletes a response template
   */
  async responseTemplatesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const template = await ResponseTemplates.getResponseTemplate(_id);
    const removed = await ResponseTemplates.removeResponseTemplate(_id);

    const extraDesc: LogDesc[] = await gatherBrandNames({
      idFields: [template.brandId || ''],
      foreignKey: 'brandId',
    });

    await putDeleteLog(
      {
        type: MODULE_NAMES.RESPONSE_TEMPLATE,
        object: template,
        description: `"${template.name}" has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(responseTemplateMutations, 'manageResponseTemplate');

export default responseTemplateMutations;
