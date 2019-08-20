export const types = `
  type PipelineTemplateStage {
    name: String!
    formId: String!
    order: Int
  }

  input PipelineTemplateStageInput {
    name: String!
    formId: String!
  }
  
  type PipelineTemplate {
    _id: String!
    name: String!
    description: String
    type: String
    stages: [PipelineTemplateStage]
  }
`;

const commonParams = `
  name: String!
  description: String
  type: String!
  stages: [PipelineTemplateStageInput]
`;

export const queries = `
  pipelineTemplates(type: String!): [PipelineTemplate]
  pipelineTemplateDetail(_id: String!): PipelineTemplate
  pipelineTemplatesTotalCount: Int
`;

export const mutations = `
  pipelineTemplatesAdd(${commonParams}): PipelineTemplate
  pipelineTemplatesEdit(_id: String!, ${commonParams}): PipelineTemplate
  pipelineTemplatesRemove(_id: String!): JSON
  pipelineTemplatesDuplicate(_id: String!): PipelineTemplate
`;
