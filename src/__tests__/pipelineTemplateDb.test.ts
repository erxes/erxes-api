import { pipelineTemplateFactory } from '../db/factories';
import { PipelineTemplates } from '../db/models';
import { IPipelineTemplateDocument } from '../db/models/definitions/pipelineTemplates';

import './setup.ts';

describe('Test pipeline template model', () => {
  let pipelineTemplate: IPipelineTemplateDocument;

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
      },
      pipelineTemplate.stages,
    );

    expect(created).toBeDefined();
    expect(created.name).toEqual(pipelineTemplate.name);
    expect(created.description).toEqual(pipelineTemplate.description);
    expect(created.stages.length).toEqual(pipelineTemplate.stages.length);
  });

  test('Update pipeline template', async () => {
    const name = 'Updated name';
    const description = 'Updated description';

    const updated = await PipelineTemplates.updatePipelineTemplate(
      pipelineTemplate._id,
      {
        name,
        description,
      },
      pipelineTemplate.stages,
    );

    expect(updated).toBeDefined();
    expect(updated.name).toEqual(name);
    expect(updated.description).toEqual(description);
    expect(updated.stages.length).toEqual(pipelineTemplate.stages.length);
  });

  test('Remove pipeline template', async () => {
    const isDeleted = await PipelineTemplates.removePipelineTemplate(pipelineTemplate.id);

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
