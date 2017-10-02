/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { EmailTemplates, Users } from '../db/models';
import { emailTemplateFactory, userFactory } from '../db/factories';
import emailTemplateMutations from '../data/resolvers/mutations/emailTemplate';

beforeAll(() => connect());

afterAll(() => disconnect());

describe('Email template mutations', () => {
  let _emailTemplate;
  let _user;

  beforeEach(async () => {
    // Creating test data
    _emailTemplate = await emailTemplateFactory();
    _user = await userFactory();
  });

  afterEach(async () => {
    // Clearing test data
    await EmailTemplates.remove({});
  });

  test('Create email template', async () => {
    const emailTemplateObj = await emailTemplateMutations.emailTemplateAdd(
      {},
      { name: _emailTemplate.name, content: _emailTemplate.content },
      { user: _user },
    );
    expect(emailTemplateObj).toBeDefined();
  });

  test('Update email template', async () => {
    const emailTemplateObj = await emailTemplateMutations.emailTemplateEdit(
      {},
      { _id: _emailTemplate.id, name: _emailTemplate.name, content: _emailTemplate.content },
      { user: _user },
    );

    expect(emailTemplateObj).toBeDefined();
  });

  test('Delete brand', async () => {
    const isDeleted = await emailTemplateMutations.emailTemplateRemove(
      {},
      { _id: _emailTemplate.id },
      { user: _user },
    );
    expect(isDeleted).toBeTruthy();
  });
});
