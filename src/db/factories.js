import shortid from 'shortid';
import faker from 'faker';
import { Users, Integrations, Brands, EmailTemplates, Forms, FormFields } from './models';

export const userFactory = (params = {}) => {
  const user = new Users({
    username: params.username || faker.random.word(),
    details: {
      fullName: params.fullName || faker.random.word(),
    },
  });

  return user.save();
};

export const integrationFactory = params => {
  const integration = new Integrations({
    name: faker.random.word(),
    kind: params.kind || 'messenger',
    brandId: params.brandId || shortid.generate(),
    formId: params.formId || shortid.generate(),
  });

  return integration.save();
};

export const brandFactory = (params = {}) => {
  const brand = new Brands({
    name: faker.random.word(),
    code: params.code || faker.random.word(),
    userId: shortid.generate(),
    emailConfig: {
      type: 'simple',
      template: faker.random.word(),
    },
  });

  return brand.save();
};

export const emailTemplateFactory = (params = {}) => {
  const emailTemplate = new EmailTemplates({
    name: faker.random.word(),
    content: params.content || faker.random.word(),
  });

  return emailTemplate.save();
};

export const formFactory = ({ title, code, createdUserId }) => {
  return Forms.createForm({
    title: title || faker.random.word(),
    description: faker.random.word(),
    code: code || shortid.generate(),
    createdUserId,
  });
};

export const formFieldFactory = (formId, params) => {
  return FormFields.createFormField(formId || shortid.id(), {
    type: params.type || faker.random.word(),
    name: faker.random.word(),
    validation: params.validation || faker.random.word(),
    text: faker.random.word(),
    description: faker.random.word(),
    isRequired: params.isRequired || false,
    number: faker.random.word(),
  });
};
