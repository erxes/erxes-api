import * as toBeType from 'jest-tobetype';
import { customerFactory, fieldFactory, formFactory, userFactory } from '../db/factories';
import { Customers, Fields, Forms, Users } from '../db/models';

import { FORM_TYPES } from '../db/models/definitions/constants';
import './setup.ts';

expect.extend(toBeType);

describe('form creation', () => {
  let _user;

  beforeEach(async () => {
    _user = await userFactory({});
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Forms.deleteMany({});
  });

  test('check if form creation method is working successfully', async () => {
    const form = await Forms.createForm(
      {
        title: 'Test form',
        description: 'Test form description',
        type: FORM_TYPES.GROWTH_HACK,
      },
      _user._id,
    );

    const formObj = await Forms.findOne({ _id: form._id });

    if (!formObj || !formObj.code) {
      throw new Error('Form not found');
    }

    expect(formObj.title).toBe('Test form');
    expect(formObj.description).toBe('Test form description');
    expect(formObj.code.length).toBe(6);
    expect(formObj.createdDate).toBeDefined();
    expect(formObj.createdUserId).toBe(_user._id);
  });
});

describe('form update', () => {
  let _user;
  let _form;

  beforeEach(async () => {
    _user = await userFactory({});
    _form = await formFactory({ createdUserId: _user });
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Forms.deleteMany({});
  });

  test('check if form update method is working successfully', async () => {
    const doc = {
      title: 'Test form 2',
      description: 'Test form description 2',
      type: FORM_TYPES.GROWTH_HACK,
    };

    const formAfterUpdate = await Forms.updateForm(_form._id, doc);

    expect(formAfterUpdate.title).toBe(doc.title);
    expect(formAfterUpdate.description).toBe(doc.description);
    expect(formAfterUpdate.createdUserId).toBe(_form.createdUserId);
    expect(formAfterUpdate.code).toBe(_form.code);
    expect(_form.createdDate).toBeDefined();
  });
});

describe('form remove', async () => {
  let _form;

  beforeEach(async () => {
    _form = await formFactory({});
  });

  afterEach(async () => {
    await Forms.deleteMany({});
    await Fields.deleteMany({});
    await Customers.deleteMany({});
  });

  test('check if form removal is working successfully', async () => {
    const customer = await customerFactory({});

    await fieldFactory({
      contentType: 'customer',
      contentTypeId: customer._id,
    });
    await fieldFactory({ contentType: 'form', contentTypeId: _form._id });
    await fieldFactory({ contentType: 'form', contentTypeId: _form._id });
    await fieldFactory({ contentType: 'form', contentTypeId: _form._id });

    await Forms.removeForm(_form._id);

    const formCount = await Forms.find({}).countDocuments();
    const fieldsCount = await Fields.find({}).countDocuments();

    expect(formCount).toBe(0);
    expect(fieldsCount).toBe(1);
  });
});

describe('form duplication', () => {
  let _user;
  let _form;

  beforeEach(async () => {
    _user = await userFactory({});
    _form = await formFactory({ createdUserId: _user._id });
    await fieldFactory({ contentTypeId: _form._id });
    await fieldFactory({ contentTypeId: _form._id });
    await fieldFactory({ contentTypeId: _form._id });
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Fields.deleteMany({});
    await Forms.deleteMany({});
  });

  test('test whether form duplication method is working successfully', async () => {
    const duplicatedForm = await Forms.duplicate(_form._id);

    if (!duplicatedForm || !duplicatedForm.code) {
      throw new Error('Form not found');
    }

    expect(duplicatedForm.title).toBe(`${_form.title} duplicated`);
    expect(duplicatedForm.description).toBe(_form.description);
    expect(duplicatedForm.code.length).toEqual(6);
    expect(duplicatedForm.createdUserId).toBe(_form.createdUserId);

    const fieldsCount = await Fields.find({}).countDocuments();

    const duplicatedFieldsCount = await Fields.find({
      contentType: 'form',
      contentTypeId: duplicatedForm._id,
    }).countDocuments();

    expect(fieldsCount).toEqual(6);
    expect(duplicatedFieldsCount).toEqual(3);
  });
});
