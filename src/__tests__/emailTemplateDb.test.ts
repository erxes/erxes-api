import { emailTemplateFactory } from '../db/factories';
import { EmailTemplates } from '../db/models';

describe('Email template db', () => {
  let _emailTemplate;

  beforeEach(async () => {
    // Creating test data
    _emailTemplate = await emailTemplateFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await EmailTemplates.deleteMany({});
  });

  test('Create email template', async () => {
    const emailTemplateObj = await EmailTemplates.create({
      name: _emailTemplate.name,
      content: _emailTemplate.content,
    });
    expect(emailTemplateObj).toBeDefined();
    expect(emailTemplateObj.name).toBe(_emailTemplate.name);
    expect(emailTemplateObj.content).toBe(_emailTemplate.content);
  });

  test('Update email template', async () => {
    const doc = {
      name: _emailTemplate.name,
      content: _emailTemplate.content,
    };

    const emailTemplateObj = await EmailTemplates.updateEmailTemplate(_emailTemplate.id, doc);
    expect(emailTemplateObj.name).toBe(_emailTemplate.name);
    expect(emailTemplateObj.content).toBe(_emailTemplate.content);
  });

  test('Delete email template', async () => {
    await EmailTemplates.removeEmailTemplate(_emailTemplate.id);

    expect(await EmailTemplates.find({ _id: _emailTemplate.id }).countDocuments()).toBe(0);

    try {
      await EmailTemplates.removeEmailTemplate('test');
    } catch (e) {
      expect(e.message).toBe('Email template not found with id test');
    }
  });
});
