import { graphqlRequest } from '../db/connection';
import { formFactory, leadFactory, userFactory } from '../db/factories';
import { Forms, Leads, Users } from '../db/models';

import './setup.ts';

describe('lead and leadField mutations', () => {
  let _user;
  let _lead;
  let _form;
  let context;

  const commonParamDefs = `
    $formId: String!
  `;

  const commonParams = `
    formId: $formId
  `;

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _form = await formFactory({});
    _lead = await leadFactory({ formId: _form._id, createdUserId: _user._id });

    context = { user: _user };
  });

  afterEach(async () => {
    // Clearing test data
    await Users.deleteMany({});
    await Forms.deleteMany({});
    await Leads.deleteMany({});
  });

  test('Add lead', async () => {
    const mutation = `
      mutation leadsAdd(${commonParamDefs}) {
        leadsAdd(${commonParams}) {
          _id
          formId
        }
      }
    `;

    const args = { formId: _form._id };

    const lead = await graphqlRequest(mutation, 'leadsAdd', args, context);

    expect(lead.formId).toBe(args.formId);
  });

  test('Edit lead', async () => {
    const mutation = `
      mutation leadsEdit($_id: String! ${commonParamDefs}) {
        leadsEdit(_id: $_id ${commonParams}) {
          _id
          formId
        }
      }
    `;

    const form = await formFactory({});
    const args = { formId: form._id };

    const lead = await graphqlRequest(mutation, 'leadsEdit', { _id: _lead._id, ...args }, context);

    expect(lead._id).toBe(_lead._id);
    expect(lead.formId).toBe(args.formId);
  });
});
