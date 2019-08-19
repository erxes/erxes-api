import { Model, model } from 'mongoose';
import { IPipelineTemplate, IPipelineTemplateDocument, pipelineTemplateSchema } from './definitions/pipelineTemplates';

export interface IPipelineTemplateModel extends Model<IPipelineTemplateDocument> {
  createPipelineTemplate(doc: IPipelineTemplate): Promise<IPipelineTemplateDocument>;
  updatePipelineTemplate(_id: string, doc: IPipelineTemplate): Promise<IPipelineTemplateDocument>;
  removePipelineTemplate(_id: string): void;
}

export const loadPipelineTemplateClass = () => {
  class PipelineTemplate {
    /**
     * Create a pipeline template
     */
    public static async createPipelineTemplate(doc: IPipelineTemplate) {
      return PipelineTemplates.create(doc);
    }

    /**
     * Update pipeline template
     */
    public static async updatePipelineTemplate(_id: string, doc: IPipelineTemplate) {
      await PipelineTemplates.updateOne({ _id }, { $set: doc });

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
