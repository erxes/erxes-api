import { integrationFactory, scriptFactory } from '../db/factories';
import { Scripts } from '../db/models';
import './setup.ts';

describe('Script model tests', () => {
  afterEach(async () => {
    // Clearing test data
    await Scripts.deleteMany({});
  });

  test('Get script', async () => {
    try {
      await Scripts.getScript('fakeId');
    } catch (e) {
      expect(e.message).toBe('Script not found');
    }

    const script = await scriptFactory({});

    const response = await Scripts.getScript(script._id);

    expect(response).toBeDefined();
  });

  test('Create script', async () => {
    const messenger = await integrationFactory({ kind: 'messenger' });

    const doc = {
      name: 'script',
      messengerId: messenger._id,
    };

    const response = await Scripts.createScript(doc);

    expect(response.name).toBe(doc.name);
  });
});
