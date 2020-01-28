import * as _ from 'underscore';
import { PipelineTemplates } from '../../../db/models';
import { IPipelineTemplate, IPipelineTemplateStage } from '../../../db/models/definitions/pipelineTemplates';
import { MODULE_NAMES } from '../../constants';
import { gatherPipelineTemplateFieldNames, LogDesc, putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { IContext } from '../../types';
import { checkPermission } from '../boardUtils';

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

    const extraDesc: LogDesc[] = await gatherPipelineTemplateFieldNames(pipelineTemplate);

    await putCreateLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        newData: { ...doc, stages: pipelineTemplate.stages },
        description: `"${doc.name}" has been created`,
        object: pipelineTemplate,
        extraDesc,
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

    let extraDesc: LogDesc[] = await gatherPipelineTemplateFieldNames(pipelineTemplate);

    extraDesc = await gatherPipelineTemplateFieldNames(updated, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        newData: { ...doc, stages: updated.stages },
        description: `"${doc.name}" has been edited`,
        object: pipelineTemplate,
        extraDesc,
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

    const extraDesc: LogDesc[] = await gatherPipelineTemplateFieldNames(pipelineTemplate);

    const removed = await PipelineTemplates.removePipelineTemplate(_id);

    await putDeleteLog(
      {
        type: MODULE_NAMES.PIPELINE_TEMPLATE,
        object: pipelineTemplate,
        description: `"${pipelineTemplate.name}" has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

export default pipelineTemplateMutations;
