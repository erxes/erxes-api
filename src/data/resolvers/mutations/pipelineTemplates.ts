import * as _ from 'underscore';
import { PipelineTemplates } from '../../../db/models';
import { IPipelineTemplate, IPipelineTemplateStage } from '../../../db/models/definitions/pipelineTemplates';
import { MODULE_NAMES } from '../../constants';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { checkPermission } from '../boardUtils';
import { gatherFormNames, gatherUsernames, LogDesc } from './logUtils';

interface IPipelineTemplatesEdit extends IPipelineTemplate {
  _id: string;
  stages: IPipelineTemplateStage[];
}

const pipelineTemplateMutations = {
  /**
   * Create new pipeline template
   */
  async pipelineTemplatesAdd(_root, { stages, ...doc }: IPipelineTemplate, { user, docModifier }: IContext) {
    await checkPermission(doc.type, user, 'templatesAdd');

    const pipelineTemplate = await PipelineTemplates.createPipelineTemplate(
      docModifier({ createdBy: user._id, ...doc }),
      stages,
    );

    let extraDesc: LogDesc[] = [{ createdBy: user._id, name: user.username || user.email }];

    extraDesc = await gatherFormNames({
      idFields: stages.map(stage => stage.formId),
      foreignKey: 'formId',
      prevList: extraDesc,
    });

    await putCreateLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        newData: JSON.stringify({ ...doc, stages: pipelineTemplate.stages }),
        description: `"${doc.name}" has been created`,
        object: pipelineTemplate,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return pipelineTemplate;
  },

  /**
   * Edit pipeline template
   */
  async pipelineTemplatesEdit(_root, { _id, stages, ...doc }: IPipelineTemplatesEdit, { user }: IContext) {
    await checkPermission(doc.type, user, 'templatesEdit');

    const pipelineTemplate = await PipelineTemplates.getPipelineTemplate(_id);

    const updated = await PipelineTemplates.updatePipelineTemplate(_id, doc, stages);

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [pipelineTemplate.createdBy],
      foreignKey: 'createdBy',
    });

    let formIds: string[] = [];

    if (pipelineTemplate.stages && pipelineTemplate.stages.length > 0) {
      formIds = pipelineTemplate.stages.map(s => s.formId);
    }

    if (stages && stages.length > 0) {
      formIds = formIds.concat(stages.map(s => s.formId));
    }

    formIds = _.uniq(formIds);

    if (formIds.length > 0) {
      extraDesc = await gatherFormNames({
        idFields: formIds,
        foreignKey: 'formId',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        newData: JSON.stringify({ ...doc, stages: updated.stages }),
        description: `"${doc.name}" has been edited`,
        object: pipelineTemplate,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Duplicate pipeline template
   */
  async pipelineTemplatesDuplicate(_root, { _id }: { _id: string }, { user }: IContext) {
    const pipelineTemplate = await PipelineTemplates.getPipelineTemplate(_id);

    await checkPermission(pipelineTemplate.type, user, 'templatesDuplicate');

    return PipelineTemplates.duplicatePipelineTemplate(_id);
  },

  /**
   * Remove pipeline template
   */
  async pipelineTemplatesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const pipelineTemplate = await PipelineTemplates.getPipelineTemplate(_id);

    await checkPermission(pipelineTemplate.type, user, 'templatesRemove');

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [pipelineTemplate.createdBy],
      foreignKey: 'createdBy',
    });

    if (pipelineTemplate.stages && pipelineTemplate.stages.length > 0) {
      extraDesc = await gatherFormNames({
        idFields: pipelineTemplate.stages.map(s => s.formId),
        foreignKey: 'formId',
        prevList: extraDesc,
      });
    }

    const removed = await PipelineTemplates.removePipelineTemplate(_id);

    await putDeleteLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        object: pipelineTemplate,
        description: `"${pipelineTemplate.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },
};

export default pipelineTemplateMutations;
