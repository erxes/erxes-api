import { PipelineLabels, Pipelines } from '../../../db/models';
import { IPipelineLabel } from '../../../db/models/definitions/pipelineLabels';
import { MODULE_NAMES } from '../../constants';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherUsernames, LogDesc } from './logUtils';

interface IPipelineLabelsEdit extends IPipelineLabel {
  _id: string;
}

const pipelineLabelMutations = {
  /**
   * Creates a new pipeline label
   */
  async pipelineLabelsAdd(_root, { ...doc }: IPipelineLabel, { user }: IContext) {
    const pipelineLabel = await PipelineLabels.createPipelineLabel({ createdBy: user._id, ...doc });
    const pipeline = await Pipelines.findOne({ _id: doc.pipelineId });

    const extraDesc: LogDesc[] = [{ createdBy: user._id, name: user.username || user.email }];

    if (pipeline) {
      extraDesc.push({ pipelineId: pipeline._id, name: pipeline.name });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.PIPELINE_LABEL,
        newData: { ...doc, createdBy: user._id, createdAt: pipelineLabel.createdAt },
        description: `"${doc.name}" has been created`,
        object: pipelineLabel,
        extraDesc,
      },
      user,
    );

    return pipelineLabel;
  },

  /**
   * Edit pipeline label
   */
  async pipelineLabelsEdit(_root, { _id, ...doc }: IPipelineLabelsEdit, { user }: IContext) {
    const pipelineLabel = await PipelineLabels.getPipelineLabel(_id);
    const pipeline = await Pipelines.findOne({ _id: pipelineLabel.pipelineId });

    const updated = await PipelineLabels.updatePipelineLabel(_id, doc);

    let extraDesc: LogDesc[] = [];

    if (pipelineLabel && pipelineLabel.createdBy) {
      extraDesc = await gatherUsernames({
        idFields: [pipelineLabel.createdBy],
        foreignKey: 'createdBy',
      });
    }

    if (pipeline) {
      extraDesc.push({ pipelineId: pipeline._id, name: pipeline.name });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.PIPELINE_LABEL,
        newData: doc,
        description: `"${doc.name}" has been edited`,
        object: pipelineLabel,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Remove pipeline label
   */
  async pipelineLabelsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const pipelineLabel = await PipelineLabels.getPipelineLabel(_id);
    const pipeline = await Pipelines.findOne({ _id: pipelineLabel.pipelineId });
    const removed = await PipelineLabels.removePipelineLabel(_id);

    let extraDesc: LogDesc[] = [];

    if (pipelineLabel && pipelineLabel.createdBy) {
      extraDesc = await gatherUsernames({
        idFields: [pipelineLabel.createdBy],
        foreignKey: 'createdBy',
      });
    }

    if (pipeline) {
      extraDesc.push({ pipelineId: pipeline._id, name: pipeline.name });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.PIPELINE_LABEL,
        object: pipelineLabel,
        description: `"${pipelineLabel.name}" has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },

  /**
   * Attach a label
   */
  pipelineLabelsLabel(
    _root,
    { pipelineId, targetId, labelIds }: { pipelineId: string; targetId: string; labelIds: string[] },
  ) {
    return PipelineLabels.labelsLabel(pipelineId, targetId, labelIds);
  },
};

export default pipelineLabelMutations;
