import { graphqlRequest } from '../db/connection';
import { formFactory, leadFactory, userFactory } from '../db/factories';

import { Forms, Leads, Users } from '../db/models';
import './setup.ts';

describe('leadQueries', () => {
  let _user;
  let _form;

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _form = await formFactory({});
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Forms.deleteMany({});
    await Leads.deleteMany({});
  });

  test('Forms', async () => {
    // Creating test data

    await leadFactory({ formId: _form._id, createdUserId: _user._id });
    await leadFactory({ formId: _form._id, createdUserId: _user._id });

    const qry = `
      query leads {
        leads {
          _id
          formId
        }
      }
    `;

    // lead ===================
    const responses = await graphqlRequest(qry, 'leads');

    expect(responses.length).toBe(2);
  });

  test('leadDetail', async () => {
    const lead = await leadFactory({ formId: _form._id, createdUserId: _user._id });

    const qry = `
      query leadDetail($_id: String!) {
        leadDetail(_id: $_id) {
          _id
          formId
        }
      }
    `;

    const response = await graphqlRequest(qry, 'leadDetail', { _id: lead._id });

    expect(response.formId).toBe(_form._id);
  });
});
