import * as faker from 'faker';
import { pipelineTemplateFactory } from '../db/factories';
import { PipelineTemplates } from '../db/models';
import { IPipelineTemplateDocument, IPipelineTemplateStage } from '../db/models/definitions/pipelineTemplates';

import './setup.ts';

describe('Test pipeline template model', () => {
  let pipelineTemplate: IPipelineTemplateDocument;
  const stages: IPipelineTemplateStage[] = [
    { name: faker.random.word(), formId: faker.random.word() },
    { name: faker.random.word(), formId: faker.random.word() },
  ];

  beforeEach(async () => {
    // Creating test data
    pipelineTemplate = await pipelineTemplateFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await PipelineTemplates.deleteMany({});
  });

  // Test deal pipeline template
  test('Create pipeline template', async () => {
    const created = await PipelineTemplates.createPipelineTemplate(
      {
        name: pipelineTemplate.name,
        description: pipelineTemplate.description || '',
        type: pipelineTemplate.type,
      },
      stages,
    );

    expect(created).toBeDefined();
    expect(created.name).toEqual(pipelineTemplate.name);
    expect(created.description).toEqual(pipelineTemplate.description);
    expect(created.type).toEqual(pipelineTemplate.type);
    expect(created.stages.length).toEqual(pipelineTemplate.stages.length);
  });

  test('Update pipeline template', async () => {
    const name = 'Updated name';
    const description = 'Updated description';
    const type = 'Updated type';

    const updated = await PipelineTemplates.updatePipelineTemplate(
      pipelineTemplate._id,
      {
        name,
        description,
        type,
      },
      stages,
    );

    expect(updated).toBeDefined();
    expect(updated.name).toEqual(name);
    expect(updated.description).toEqual(description);
    expect(updated.type).toEqual(type);
    expect(updated.stages.length).toEqual(pipelineTemplate.stages.length);
  });

  test('Duplicate pipeline template', async () => {
    const duplicated = await PipelineTemplates.duplicatePipelineTemplate(pipelineTemplate._id);

    expect(duplicated).toBeDefined();
    expect(duplicated.name).toEqual(pipelineTemplate.name);
    expect(duplicated.description).toEqual(pipelineTemplate.description);
    expect(duplicated.type).toEqual(pipelineTemplate.type);
    expect(duplicated.stages.length).toEqual(pipelineTemplate.stages.length);
  });

  test('Remove pipeline template', async () => {
    const isDeleted = await PipelineTemplates.removePipelineTemplate(pipelineTemplate._id);

    expect(isDeleted).toBeTruthy();
  });

  test('Remove pipeline template not found', async () => {
    expect.assertions(1);

    const fakeId = 'fakeId';

    try {
      await PipelineTemplates.removePipelineTemplate(fakeId);
    } catch (e) {
      expect(e.message).toEqual('Pipeline template not found');
    }
  });
});
