export const types = `
  type PipelineTemplateStage {
    name: String!
    formId: String!
  }

  input PipelineTemplateStageInput {
    name: String!
    formId: String!
  }
  
  type PipelineTemplate {
    _id: String!
    name: String!
    description: String
    stages: [PipelineTemplateStage]
  }
`;

const commonParams = `
  name: String!
  description: String
  stages: [PipelineTemplateStageInput]
`;

export const queries = `
  pipelineTemplates(page: Int, perPage: Int): [PipelineTemplate]
  pipelineTemplateDetail(_id: String!): PipelineTemplate
  pipelineTemplatesTotalCount: Int
`;

export const mutations = `
  pipelineTemplatesAdd(${commonParams}): PipelineTemplate
  pipelineTemplatesEdit(_id: String!, ${commonParams}): PipelineTemplate
  pipelineTemplatesRemove(_id: String!): JSON
`;
