import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { pipelineTemplateFactory } from '../db/factories';
import { PipelineTemplates } from '../db/models';

import './setup.ts';

/*
 * Generate test data
 */
const args = {
  name: faker.name.findName(),
  description: faker.random.word(),
  stages: [
    { name: 'Stage 1', formId: 'formId1' },
    { name: 'Stage 2', formId: 'formId2' },
    { name: 'Stage 3', formId: 'formId3' },
    { name: 'Stage 4', formId: 'formId4' },
  ],
};

describe('PipelineTemplates mutations', () => {
  let pipelineTemplate;

  const commonParamDefs = `
    $name: String!
    $description: String
    $stages: [PipelineTemplateStageInput]
  `;

  const commonParams = `
    name: $name
    description: $description
    stages: $stages
  `;

  const commonReturn = `
    name
    description
    stages {
      name
      formId
      order
    }
  `;

  beforeEach(async () => {
    // Creating test data
    pipelineTemplate = await pipelineTemplateFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await PipelineTemplates.deleteMany({});
  });

  test('Add pipelineTemplate', async () => {
    const mutation = `
      mutation pipelineTemplatesAdd(${commonParamDefs}){
        pipelineTemplatesAdd(${commonParams}) {
          ${commonReturn}
        }
      }
    `;

    const created = await graphqlRequest(mutation, 'pipelineTemplatesAdd', args);

    expect(created.name).toBe(args.name);
    expect(created.description).toBe(args.description);

    expect(created.stages[0].formId).toBe('formId1');
    expect(created.stages[1].formId).toBe('formId2');
    expect(created.stages[2].formId).toBe('formId3');
    expect(created.stages[3].formId).toBe('formId4');
  });

  test('Edit pipelineTemplate', async () => {
    const mutation = `
      mutation pipelineTemplatesEdit($_id: String! ${commonParamDefs}){
        pipelineTemplatesEdit(_id: $_id ${commonParams}) {
          _id
          ${commonReturn}
        }
      }
    `;

    const edited = await graphqlRequest(mutation, 'pipelineTemplatesEdit', { _id: pipelineTemplate._id, ...args });

    expect(edited._id).toBe(pipelineTemplate._id);
    expect(edited.name).toBe(args.name);
    expect(edited.description).toBe(args.description);
    expect(edited.stages.length).toBe(args.stages.length);
  });

  test('Remove pipelineTemplate', async () => {
    const mutation = `
      mutation pipelineTemplatesRemove($_id: String!) {
        pipelineTemplatesRemove(_id: $_id)
      }
    `;

    await graphqlRequest(mutation, 'pipelineTemplatesRemove', { _id: pipelineTemplate._id });

    expect(await PipelineTemplates.find({ _id: { $in: [pipelineTemplate._id] } })).toEqual([]);
  });

  test('Duplicate pipelineTemplate', async () => {
    const mutation = `
      mutation pipelineTemplatesDuplicate($_id: String!) {
        pipelineTemplatesDuplicate(_id: $_id) {
          _id
          name
          description
          stages {
            name
            formId
          }
        }
      }
    `;

    const duplicated = await graphqlRequest(mutation, 'pipelineTemplatesDuplicate', { _id: pipelineTemplate._id });

    expect(duplicated.name).toBe(pipelineTemplate.name);
    expect(duplicated.description).toBe(pipelineTemplate.description);
    expect(duplicated.stages.length).toBe(pipelineTemplate.stages.length);
  });
});
