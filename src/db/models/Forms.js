import mongoose from 'mongoose';
import Random from 'meteor-random';
import { Integrations, Fields } from './';
import { FIELD_CONTENT_TYPES } from '../../data/constants';

// schema for form document
const FormSchema = mongoose.Schema({
  _id: {
    type: String,
    default: () => Random.id(),
  },
  title: String,
  description: {
    type: String,
    required: false,
  },
  code: String,
  createdUserId: String,
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

class Form {
  /**
   * Generates a random and unique 6 letter code
   * @return {string} random code
   */
  static async generateCode() {
    let code;
    let foundForm = true;

    do {
      code = Random.id().substr(0, 6);
      foundForm = await Forms.findOne({ code });
    } while (foundForm);

    return code;
  }

  /**
   * Creates a form document
   * @param {Object} doc - Form object
   * @param {string} doc.title - Form title
   * @param {string} doc.description - Form description
   * @param {Date} doc.createdDate - Form creation date
   * @param {Object|string} createdUser - The user who is creating this form,
   * can be both user id or user object
   * @return {Promise} returns Form document promise
   * @throws {Error} throws Error if createdUser is not supplied
   */
  static async createForm(doc, createdUserId) {
    if (!createdUserId) {
      throw new Error('createdUser must be supplied');
    }

    doc.code = await this.generateCode();
    doc.createdDate = new Date();
    doc.createdUserId = createdUserId;

    return this.create(doc);
  }

  /**
   * Updates a form document
   * @param {string} _id - Form id
   * @param {Object} object - Form object
   * @param {string} object.title - Form title
   * @param {string} object.description - Form description
   * @return {Promise} returns Promise resolving updated Form document
   */
  static async updateForm(_id, { title, description }) {
    await this.update({ _id }, { $set: { title, description } }, { runValidators: true });
    return this.findOne({ _id });
  }

  /**
   * Remove a form
   * @param {string} _id - Form document id
   * @return {Promise}
   * @throws {Error} throws Error if this form has fields or if used in an integration
   */
  static async removeForm(_id) {
    const fieldCount = await Fields.find({ contentTypeId: _id }).count();

    if (fieldCount > 0) {
      throw new Error('You cannot delete this form. This form has some fields.');
    }

    const integrationCount = await Integrations.find({ formId: _id }).count();

    if (integrationCount > 0) {
      throw new Error('You cannot delete this form. This form used in integration.');
    }

    return this.remove({ _id });
  }

  /**
   * Duplicates form and form fields of the form
   * @param {string} _id - form id
   * @return {Field} - returns the duplicated copy of the form
   */
  static async duplicate(_id) {
    const form = await this.findOne({ _id });

    // duplicate form ===================
    const newForm = await this.createForm(
      {
        title: `${form.title} duplicated`,
        description: form.description,
      },
      form.createdUserId,
    );

    // duplicate fields ===================
    const fields = await Fields.find({ contentTypeId: _id });

    for (let field of fields) {
      await Fields.createField({
        contentType: FIELD_CONTENT_TYPES.FORM,
        contentTypeId: newForm._id,
        type: field.type,
        validation: field.validation,
        text: field.text,
        description: field.description,
        options: field.options,
        isRequired: field.isRequired,
        order: field.order,
      });
    }

    return newForm;
  }
}

FormSchema.loadClass(Form);

const Forms = mongoose.model('forms', FormSchema);

export default Forms;
