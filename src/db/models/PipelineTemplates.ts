import { Model, model } from 'mongoose';
import {
  IPipelineTemplateDocument,
  IPipelineTemplateStage,
  pipelineTemplateSchema,
} from './definitions/pipelineTemplates';

interface IDoc {
  name: string;
  description: string;
}

export interface IPipelineTemplateModel extends Model<IPipelineTemplateDocument> {
  createPipelineTemplate(doc: IDoc, stages: IPipelineTemplateStage[]): Promise<IPipelineTemplateDocument>;
  updatePipelineTemplate(_id: string, doc: IDoc, stages: IPipelineTemplateStage[]): Promise<IPipelineTemplateDocument>;
  removePipelineTemplate(_id: string): void;
  duplicatePipelineTemplate(_id: string): Promise<IPipelineTemplateDocument>;
}

export const loadPipelineTemplateClass = () => {
  class PipelineTemplate {
    /**
     * Create a pipeline template
     */
    public static async createPipelineTemplate(doc: IDoc, stages: IPipelineTemplateStage[]) {
      const orderedStages = stages.map((stage, index) => ({ ...stage, index }));

      return PipelineTemplates.create({ ...doc, stages: orderedStages });
    }

    /**
     * Update pipeline template
     */
    public static async updatePipelineTemplate(_id: string, doc: IDoc, stages: IPipelineTemplateStage[]) {
      const orderedStages = stages.map((stage, index) => ({ ...stage, index }));

      await PipelineTemplates.updateOne({ _id }, { $set: { ...doc, stages: orderedStages } });

      return PipelineTemplates.findOne({ _id });
    }

    /**
     * Duplicate pipeline template
     */
    public static async duplicatePipelineTemplate(_id: string) {
      const pipelineTemplate = await PipelineTemplates.findOne({ _id }).lean();

      if (!pipelineTemplate) {
        throw new Error('Pipeline template not found');
      }

      const duplicated: IDoc = {
        name: pipelineTemplate.name,
        description: pipelineTemplate.description || '',
      };

      return PipelineTemplates.createPipelineTemplate(duplicated, pipelineTemplate.stages);
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
