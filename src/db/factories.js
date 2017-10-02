import shortid from 'shortid';
import faker from 'faker';
import { Users, Integrations } from './models';

export const userFactory = (params = {}) => {
  const user = new Users({
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
