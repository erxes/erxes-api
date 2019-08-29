import { formFactory, leadFactory, userFactory } from '../db/factories';
import { Leads, Users } from '../db/models';

import './setup.ts';

describe('leadDb', () => {
  let _user;
  let _lead;
  let _form;

  beforeEach(async () => {
    _user = await userFactory({});
    _form = await formFactory();
    _lead = await leadFactory({ formId: _form._id, createdUserId: _user._id });
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Leads.deleteMany({});
  });

  test('check if lead creation method is working successfully', async () => {
    const leadObj = await Leads.findOne({ _id: _lead._id });

    if (!leadObj) {
      throw new Error('Lead not found');
    }

    expect(leadObj.formId).toBe(_form._id);
    expect(leadObj.createdDate).toBeDefined();
    expect(leadObj.createdUserId).toBe(_user._id);
  });

  test('check if lead update method is working successfully', async () => {
    const form = await formFactory();
    const doc = { formId: form._id };

    const leadAfterUpdate = await Leads.updateLead(_lead._id, doc);

    expect(leadAfterUpdate.createdUserId).toBe(_lead.createdUserId);
    expect(leadAfterUpdate.formId).toBe(form._id);
    expect(_lead.createdDate).toBeDefined();
  });

  test('test whether lead duplication method is working successfully', async () => {
    const duplicatedLead = await Leads.duplicate(_lead._id);

    if (!duplicatedLead) {
      throw new Error('Lead not found');
    }

    expect(duplicatedLead.createdUserId).toBe(_lead.createdUserId);
    expect(duplicatedLead.formId).toBe(_lead.formId);
  });
});
