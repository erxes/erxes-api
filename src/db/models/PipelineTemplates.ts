import { Model, model } from 'mongoose';
import {
  IPipelineTemplate,
  IPipelineTemplateDocument,
  IPipelineTemplateStage,
  pipelineTemplateSchema,
} from './definitions/pipelineTemplates';

export interface IPipelineTemplateModel extends Model<IPipelineTemplateDocument> {
  createPipelineTemplate(doc: IPipelineTemplate, stages: IPipelineTemplateStage[]): Promise<IPipelineTemplateDocument>;
  updatePipelineTemplate(
    _id: string,
    doc: IPipelineTemplate,
    stages: IPipelineTemplateStage[],
  ): Promise<IPipelineTemplateDocument>;
  removePipelineTemplate(_id: string): void;
}

export const loadPipelineTemplateClass = () => {
  class PipelineTemplate {
    /**
     * Create a pipeline template
     */
    public static async createPipelineTemplate(doc: IPipelineTemplate, stages: IPipelineTemplateStage[]) {
      const orderedStages = stages.map((stage, index) => ({ ...stage, index }));

      return PipelineTemplates.create({ ...doc, stages: orderedStages });
    }

    /**
     * Update pipeline template
     */
    public static async updatePipelineTemplate(_id: string, doc: IPipelineTemplate, stages: IPipelineTemplateStage[]) {
      const orderedStages = stages.map((stage, index) => ({ ...stage, index }));

      await PipelineTemplates.updateOne({ _id }, { $set: { ...doc, stages: orderedStages } });

      return PipelineTemplates.findOne({ _id });
    }

    /**
     * Remove pipeline template
     */
    public static async removePipelineTemplate(_id: string) {
      const pipelineTemplate = await PipelineTemplates.findOne({ _id });

      if (!pipelineTemplate) {
        throw new Error('Pipeline template not found');
      }

      return PipelineTemplates.deleteOne({ _id });
    }
  }

  pipelineTemplateSchema.loadClass(PipelineTemplate);

  return pipelineTemplateSchema;
};

loadPipelineTemplateClass();

// tslint:disable-next-line
const PipelineTemplates = model<IPipelineTemplateDocument, IPipelineTemplateModel>(
  'pipeline_templates',
  pipelineTemplateSchema,
);

export default PipelineTemplates;
