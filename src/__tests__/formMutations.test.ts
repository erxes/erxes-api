import * as faker from 'faker';
import { graphqlRequest } from '../db/connection';
import { fieldFactory, formFactory, growthHackFactory, integrationFactory } from '../db/factories';
import { Conversations, Customers, Forms, FormSubmissions, Users } from '../db/models';

import Messages from '../db/models/ConversationMessages';
import { FORM_TYPES } from '../db/models/definitions/constants';
import { IFieldDocument } from '../db/models/definitions/fields';
import './setup.ts';

/*
 * Generate test data
 */
const args = {
  title: faker.random.word(),
  description: faker.random.word(),
  type: FORM_TYPES.GROWTH_HACK,
};

describe('form and formField mutations', () => {
  let _form;

  const commonParamDefs = `
    $title: String!
    $type: String!
    $description: String
  `;

  const commonParams = `
    title: $title
    type: $type
    description: $description
  `;

  beforeEach(async () => {
    // Creating test data
    _form = await formFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await Users.deleteMany({});
    await Forms.deleteMany({});
    await FormSubmissions.deleteMany({});
  });

  test('Add form', async () => {
    const mutation = `
      mutation formsAdd(${commonParamDefs}) {
        formsAdd(${commonParams}) {
          title
          description
        }
      }
    `;

    const form = await graphqlRequest(mutation, 'formsAdd', args);

    expect(form.title).toBe(args.title);
    expect(form.description).toBe(args.description);
  });

  test('Edit form', async () => {
    const mutation = `
      mutation formsEdit($_id: String! ${commonParamDefs}) {
        formsEdit(_id: $_id ${commonParams}) {
          _id
          title
          description
        }
      }
    `;

    const form = await graphqlRequest(mutation, 'formsEdit', { _id: _form._id, ...args });

    expect(form._id).toBe(_form._id);
    expect(form.title).toBe(args.title);
    expect(form.description).toBe(args.description);
  });

  test('Form submission save', async () => {
    const mutation = `
      mutation formSubmissionsSave($formId: String $contentTypeId: String $contentType: String $formSubmissions: JSON) {
        formSubmissionsSave(formId: $formId contentTypeId: $contentTypeId contentType: $contentType formSubmissions: $formSubmissions)
      }
    `;

    const growthHack = await growthHackFactory();
    const form = await formFactory();
    const formField = await fieldFactory({ text: 'age', contentType: 'form', contentTypeId: form._id });

    const formSubmissionArgs: any = {
      formId: form._id,
      contentTypeId: growthHack._id,
      contentType: 'growthHack',
      formSubmissions: {
        [formField._id]: 10,
      },
    };

    let response = await graphqlRequest(mutation, 'formSubmissionsSave', formSubmissionArgs);

    expect(response).toBe(true);

    formSubmissionArgs.formSubmissions = null;
    response = await graphqlRequest(mutation, 'formSubmissionsSave', formSubmissionArgs);

    expect(response).toBe(true);

    formSubmissionArgs.formSubmissions = {
      [formField._id]: 20,
    };

    response = await graphqlRequest(mutation, 'formSubmissionsSave', formSubmissionArgs);

    expect(response).toBe(true);
  });

  describe('validate', async () => {
    const formId = 'DFDFDAFD';
    const contentTypeId = formId;

    test('validate', async () => {
      const requiredField = await fieldFactory({
        contentTypeId,
        isRequired: true,
      });

      const emailField = await fieldFactory({
        contentTypeId,
        validation: 'email',
      });

      const phoneField = await fieldFactory({
        contentTypeId,
        validation: 'phone',
      });

      const validPhoneField = await fieldFactory({
        contentTypeId,
        validation: 'phone',
      });

      const numberField = await fieldFactory({
        contentTypeId,
        validation: 'number',
      });

      const validNumberField = await fieldFactory({
        contentTypeId,
        validation: 'number',
      });

      const validDateField = await fieldFactory({
        contentTypeId,
        validation: 'date',
      });

      const dateField = await fieldFactory({
        contentTypeId,
        validation: 'date',
      });

      const submissions = [
        { _id: requiredField._id, value: null },
        { _id: emailField._id, value: 'email', validation: 'email' },
        { _id: phoneField._id, value: 'phone', validation: 'phone' },
        { _id: validPhoneField._id, value: '88183943', validation: 'phone' },
        { _id: numberField._id, value: 'number', validation: 'number' },
        { _id: validNumberField._id, value: 10, validation: 'number' },
        { _id: dateField._id, value: 'date', validation: 'date' },
        { _id: validDateField._id, value: '2012-09-01', validation: 'date' },
      ];

      // call function
      const errors = await Forms.validate(formId, submissions);

      // must be 4 error
      expect(errors.length).toEqual(5);

      const [requiredError, emailError, phoneError, numberError, dateError] = errors;

      // required
      expect(requiredError.fieldId).toEqual(requiredField._id);
      expect(requiredError.code).toEqual('required');

      // email
      expect(emailError.fieldId).toEqual(emailField._id);
      expect(emailError.code).toEqual('invalidEmail');

      // phone
      expect(phoneError.fieldId).toEqual(phoneField._id);
      expect(phoneError.code).toEqual('invalidPhone');

      // number
      expect(numberError.fieldId).toEqual(numberField._id);
      expect(numberError.code).toEqual('invalidNumber');

      // date
      expect(dateError.fieldId).toEqual(dateField._id);
      expect(dateError.code).toEqual('invalidDate');
    });
  });

  describe('saveValues', () => {
    const formTitle = 'Form';

    let integrationId: string;
    let formId: string;

    let emailField: IFieldDocument;
    let phoneField: IFieldDocument;
    let firstNameField: IFieldDocument;
    let lastNameField: IFieldDocument;
    let arbitraryField: IFieldDocument;

    beforeEach(async () => {
      integrationId = (await integrationFactory({}))._id;
      formId = (await formFactory({ title: formTitle }))._id;

      const contentTypeId = formId;

      phoneField = await fieldFactory({
        contentTypeId,
        type: 'phoneFieldId',
      });

      emailField = await fieldFactory({
        contentTypeId,
        type: 'emailFieldId',
      });

      firstNameField = await fieldFactory({
        contentTypeId,
        type: 'firstNameFieldId',
      });

      lastNameField = await fieldFactory({
        contentTypeId,
        type: 'lastNameFieldId',
      });

      arbitraryField = await fieldFactory({ contentTypeId, type: 'input' });
    });

    test('saveValues', async () => {
      const submissions = [
        { _id: arbitraryField._id, value: 'Value', type: 'input' },
        { _id: phoneField._id, value: '88183943', type: 'phone' },
        { _id: emailField._id, value: 'email@gmail.com', type: 'email' },
        { _id: firstNameField._id, value: 'first name', type: 'firstName' },
        { _id: lastNameField._id, value: 'last name', type: 'lastName' },
      ];

      const browserInfo = {
        remoteAddress: '127.0.0.1',
        url: 'localhost',
        hostname: 'localhost.com',
        language: 'en',
        userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5)
          AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36`,
      };

      // call function
      const mutation = `
        mutation saveLead(
          $integrationId: String!
          $formId: String!
          $submissions: [FieldValueInput]
          $browserInfo: JSON!
        )
          saveLead(
            integrationId: $integrationId
            formId: $formId
            submissions: $submissions
            browserInfo: $browserk
          ) {
            title
            description
          }
        }
      `;

      await graphqlRequest(mutation, 'saveLead', { integrationId, formId, submissions, browserInfo });

      // must create 1 conversation
      expect(await Conversations.find().countDocuments()).toBe(1);

      // must create 1 message
      expect(await Messages.find().countDocuments()).toBe(1);

      // check conversation fields
      const conversation = await Conversations.findOne({});

      if (!conversation) {
        throw new Error('conversation not found');
      }

      expect(conversation.content).toBe(formTitle);
      expect(conversation.integrationId).toBe(integrationId);
      expect(conversation.customerId).toEqual(expect.any(String));

      // check message fields
      const message = await Messages.findOne({});

      if (!message) {
        throw new Error('message not found');
      }

      expect(message.conversationId).not.toBe(null);
      expect(message.content).toBe(formTitle);
      expect(message.formWidgetData).toEqual(submissions);

      // must create 1 customer
      expect(await Customers.find().countDocuments()).toBe(1);

      // check customer fields
      const customer = await Customers.findOne({});

      if (!customer) {
        throw new Error('customer not found');
      }

      expect(customer.primaryPhone).toBe('88183943');
      expect(customer.primaryEmail).toBe('email@gmail.com');
      expect(customer.emails).toContain('email@gmail.com');
      expect(customer.firstName).toBe('first name');
      expect(customer.lastName).toBe('last name');

      if (!customer.location) {
        throw new Error('location is null');
      }

      expect(customer.location.hostname).toBe(browserInfo.hostname);
      expect(customer.location.language).toBe(browserInfo.language);
      expect(customer.location.userAgent).toBe(browserInfo.userAgent);
    });
  });
});
