import { Document, Schema } from 'mongoose';
import { field } from './utils';

export interface IPipelineTemplateStage {
  name: string;
  formId: string;
}

export interface IPipelineTemplate {
  name: string;
  description?: string;
  type: string;
  stages: IPipelineTemplateStage[];
}

export interface IPipelineTemplateDocument extends IPipelineTemplate, Document {
  _id: string;
}

const stageSchema = new Schema(
  {
    name: field({ type: String }),
    formId: field({ type: String, optional: true }),
    order: field({ type: Number }),
  },
  { _id: false },
);

export const pipelineTemplateSchema = new Schema({
  _id: field({ pkey: true }),

  name: field({ type: String }),
  type: field({ type: String }),
  description: field({ type: String, optional: true }),
  stages: field({ type: [stageSchema], default: [] }),
});
