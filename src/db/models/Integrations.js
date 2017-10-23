import mongoose from 'mongoose';
import 'mongoose-type-email';
import Random from 'meteor-random';
import { Messages, Conversations } from './Conversations';
import { Customers } from './';
import {
  KIND_CHOICES,
  FORM_SUCCESS_ACTIONS,
  FORM_LOAD_TYPES,
  MESSENGER_DATA_AVAILABILITY,
} from '../../data/constants';

// subdocument schema for MessengerOnlineHours
const MessengerOnlineHoursSchema = mongoose.Schema(
  {
    day: String,
    from: String,
    to: String,
  },
  { _id: false },
);

// subdocument schema for MessengerData
const MessengerDataSchema = mongoose.Schema(
  {
    notifyCustomer: Boolean,
    availabilityMethod: {
      type: String,
      enum: MESSENGER_DATA_AVAILABILITY.ALL,
    },
    isOnline: {
      type: Boolean,
    },
    onlineHours: [MessengerOnlineHoursSchema],
    timezone: String,
    welcomeMessage: String,
    awayMessage: String,
    thankYouMessage: String,
  },
  { _id: false },
);

// subdocument schema for FormData
const FormDataSchema = mongoose.Schema(
  {
    loadType: {
      type: String,
      enum: FORM_LOAD_TYPES.ALL_LIST,
    },
    successAction: {
      type: String,
      enum: FORM_SUCCESS_ACTIONS.ALL_LIST,
    },
    fromEmail: mongoose.SchemaTypes.Email,
    userEmailTitle: String,
    userEmailContent: String,
    adminEmails: [mongoose.SchemaTypes.Email],
    adminEmailTitle: String,
    adminEmailContent: String,
    thankContent: String,
    redirectUrl: String,
  },
  { _id: false },
);

// subdocument schema for messenger UiOptions
const UiOptionsSchema = mongoose.Schema(
  {
    color: String,
    wallpaper: String,
    logo: String,
  },
  { _id: false },
);

// subdocument schema for twitter data
const TwitterSchema = mongoose.Schema(
  {
    // TODO: should be userId
    id: {
      type: Number,
    },
    token: String,
    tokenSecret: String,
  },
  { _id: false },
);

// subdocument schema for facebook data
const FacebookSchema = mongoose.Schema(
  {
    appId: String,
    pageIds: [String],
  },
  { _id: false },
);

// integration main document fields
const integrationFields = {
  _id: {
    type: String,
    default: () => Random.id(),
  },
  kind: {
    type: String,
    enum: KIND_CHOICES.ALL,
  },
  name: String,
  brandId: String,
};

const IntegrationSchema = mongoose.Schema(integrationFields);

// Schema for form integration
const FormIntegrationSchema = mongoose.Schema({
  ...integrationFields,
  formId: String,
  formData: FormDataSchema,
});

// Schema for messenger integration
const MessengerIntegrationSchema = mongoose.Schema({
  ...integrationFields,
  messengerData: MessengerDataSchema,
  uiOptions: UiOptionsSchema,
});

// Schema for twitter integration
const TwitterIntegrationSchema = mongoose.Schema({
  ...integrationFields,
  twitterData: TwitterSchema,
});

// Schema for facebook integration
const FacebookIntegrationSchema = mongoose.Schema({
  ...integrationFields,
  facebookData: FacebookSchema,
});

class Integration {
  /**
   * Create an integration, intended as a private method
   * @param {Object} doc - Integration object
   * @param {string} doc.kind - Integration kind
   * @param {string} doc.name - Integration name
   * @param {string} doc.brandId - Brand id of the related Brand
   * @param {string} doc.formId - Form id (used in form integrations)
   * @param {string} doc.formData.loadType - Load types for the embedded form
   * @param {string} doc.formData.successAction - TODO: need more elaborate documentation
   * @param {string} doc.formData.formEmail - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailContent - TODO: need more elaborate documentation
   * @param {Array} doc.formData.adminEmails - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.thankContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.redirectUrl - Form redirectUrl on submit
   *    TODO: need more elaborate documentation
   * @param {Object} doc.messengerData - MessengerData object
   * @param {Boolean} doc.messengerData.notifyCustomer - Identicates whether
   *    customer should be notified or not TODO: need more elaborate documentation
   * @param {string} doc.messengerData.availabilityMethod - Sets messenger
   *    availability method as auto or manual TODO: need more elaborate documentation
   * @param {Boolean} doc.messengerData.isOnline - Identicates whether messenger in online or not
   * @param {Object[]} doc.messengerData.onlineHours - OnlineHours object array
   * @param {string} doc.messengerData.onlineHours.day - OnlineHours day
   * @param {string} doc.messengerData.onlineHours.from - OnlineHours from
   * @param {string} doc.messengerData.onlineHours.to  - OnlineHours to
   * @param {string} doc.messengerData.timezone - Timezone
   * @param {string} doc.messengerData.welcomeMessage - Message displayed on welcome
   *    TODO: need more elaborate documentation
   * @param {string} doc.messengerData.awayMessage - Message displayed when status becomes away
   *    TODO: need more elaborate documentation
   * @param {string} doc.messengerData.thankYouMessage - Thank you message
   *    TODO: need more elaborate documentation
   * @param {string} doc.messengerData.uiOptions.color - Color of messenger
   * @param {string} doc.messengerData.uiOptions.wallpaper - Wallpaper image for messenger
   * @param {string} doc.messengerData.uiOptions.logo - Logo used in the embedded messenger
   * @param {Object} doc.twitterData - Twitter data
   *    TODO: need more elaborate documentation
   * @param {Object} doc.facebookData - Facebook data
   *    TODO: need more elaborate documentation
   * @return {Promise} returns integration document promise
   */
  static createIntegration(doc) {
    return this.create(doc);
  }

  /**
   * Remove integration in addition with its messages, conversations, customers
   * @param {string} id - Integration id
   * @return {Promise}
   */
  static async removeIntegration(_id) {
    const conversations = await Conversations.find({ integrationId: _id }, { _id: true });

    const conversationIds = [];

    conversations.forEach(c => {
      conversationIds.push(c._id);
    });

    // Remove messages
    await Messages.remove({ conversationId: { $in: conversationIds } });

    // Remove conversations
    await Conversations.remove({ integrationId: _id });

    // Remove customers
    await Customers.remove({ integrationId: _id });

    return this.remove({ _id });
  }

  /**
   * Remove all form integrations
   * @return {Promise}
   */
  static removeIntegrations() {
    return this.remove({ kind: KIND_CHOICES.MESSENGER });
  }
}

class FormIntegration extends Integration {
  /**
   * Generate form integration data based on the given form data (formData)
   * and integration data (mainDoc)
   * @param {Integration} mainDoc - Integration object without subdocuments
   * @param {FormData} formData - Integration forData subdocument
   * @return {Object} returns an integration object
   */
  static generateFormDoc(mainDoc, formData) {
    return {
      ...mainDoc,
      kind: KIND_CHOICES.FORM,
      formData,
    };
  }

  /**
   * Create a form kind integration
   * @param {Object} args.formData - FormData object
   * @param {string} doc.formData.loadType - Load types for the embedded form
   * @param {string} doc.formData.successAction - TODO: need more elaborate documentation
   * @param {string} doc.formData.formEmail - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailContent - TODO: need more elaborate documentation
   * @param {Email[]} doc.formData.adminEmails - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.thankContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.redirectUrl - Form redirectUrl on submit
   * @param {string} args.mainDoc - Integration main document object
   * @param {string} args.mainDoc.name - Integration name
   * @param {string} args.mainDoc.brandId - Integration brand id
   * @param {string} args.mainDoc.formId - Form id related to this integration
   * @return {Promise} returns form integration document promise
   * @throws {Exception} throws Exception if formData is notSupplied
   */
  static createFormIntegration({ formData, ...mainDoc }) {
    const doc = this.generateFormDoc(mainDoc, formData);

    if (Object.keys(formData || {}).length === 0) {
      throw new Error('formData must be supplied');
    }

    return this.create(doc);
  }

  /**
   * Update form integration
   * @param {string} _id integration id
   * @param {Object} args.formData - FormData object
   * @param {string} doc.formData.loadType - Load types for the embedded form
   * @param {string} doc.formData.successAction - TODO: need more elaborate documentation
   * @param {string} doc.formData.formEmail - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.userEmailContent - TODO: need more elaborate documentation
   * @param {Email[]} doc.formData.adminEmails - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailTitle - TODO: need more elaborate documentation
   * @param {string} doc.formData.adminEmailContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.thankContent - TODO: need more elaborate documentation
   * @param {string} doc.formData.redirectUrl - Form redirectUrl on submit
   * @param {string} args.mainDoc - Integration main document object
   * @param {string} args.mainDoc.name - Integration name
   * @param {string} args.mainDoc.brandId - Integration brand id
   * @param {string} args.mainDoc.formId - Form id related to this integration
   * @return {Promise} returns Promise resolving updated Integration document
   */
  static async updateFormIntegration(_id, { formData, ...mainDoc }) {
    const doc = this.generateFormDoc(mainDoc, formData);

    await this.update({ _id }, { $set: doc }, { runValidators: true });
    return this.findOne({ _id });
  }

  /**
   * Remove all form integrations
   * @return {Promise}
   */
  static removeIntegrations() {
    return this.remove({ kind: KIND_CHOICES.FORM });
  }
}

class MessengerIntegration extends Integration {
  /**
   * Create a messenger kind integration
   * @param {Object} object - Integration object
   * @param {string} object.name - Integration name
   * @param {String} object.brandId - Integration brand id
   * @return {Promise} returns integration document promise
   */
  static createMessengerIntegration({ name, brandId }) {
    return this.createIntegration({
      name,
      brandId,
      kind: KIND_CHOICES.MESSENGER,
    });
  }

  /**
   * Update messenger integration document
   * @param {Object} object - Integration main doc object
   * @param {string} object.name - Integration name
   * @param {string} object.brandId - Integration brand id
   * @return {Promise} returns Promise resolving updated Integration documetn
   */
  static async updateMessengerIntegration(_id, { name, brandId }) {
    await this.update({ _id }, { $set: { name, brandId } }, { runValidators: true });
    return this.findOne({ _id });
  }

  /**
   * Save messenger appearance data
   * @param {string} _id
   * @param {Object} object - MessengerUiOptions object TODO: need more elaborate documentation
   * @param {string} object.color - MessengerUiOptions color TODO: need more elaborate documentation
   * @param {string} object.wallpaper - MessengerUiOptions wallpaper
   * @param {string} object.logo - Messenger logo TODO: need more elaborate documentation
   * @return {Promise} returns Promise resolving updated Integration document
   */
  static async saveMessengerAppearanceData(_id, { color, wallpaper, logo }) {
    await this.update(
      { _id },
      { $set: { uiOptions: { color, wallpaper, logo } } },
      { runValdatiors: true },
    );

    return this.findOne({ _id });
  }

  /**
  * Saves messenger data to integration document
  * @param {Object} doc.messengerData - MessengerData object
  * @param {Boolean} doc.messengerData.notifyCustomer - Identicates whether
  *    customer should be notified or not TODO: need more elaborate documentation
  * @param {string} doc.messengerData.availabilityMethod - Sets messenger
  *    availability method as auto or manual TODO: need more elaborate documentation
  * @param {Boolean} doc.messengerData.isOnline - Identicates whether messenger in online or not
  * @param {Object[]} doc.messengerData.onlineHours - OnlineHours object array
  * @param {string} doc.messengerData.onlineHours.day - OnlineHours day
  * @param {string} doc.messengerData.onlineHours.from - OnlineHours from
  * @param {string} doc.messengerData.onlineHours.to  - OnlineHours to
  * @param {string} doc.messengerData.timezone - Timezone
  * @param {string} doc.messengerData.welcomeMessage - Message displayed on welcome
  *    TODO: need more elaborate documentation
  * @param {string} doc.messengerData.awayMessage - Message displayed when status becomes away
  *    TODO: need more elaborate documentation
  * @param {string} doc.messengerData.thankYouMessage - Thank you message
  *    TODO: need more elaborate documentation
  * @param {string} doc.messengerData.uiOptions.color - Color of messenger
  * @param {string} doc.messengerData.uiOptions.wallpaper - Wallpaper image for messenger
  * @param {string} doc.messengerData.uiOptions.logo - Logo used in the embedded messenger
  * @return {Promise} returns Promise resolving updated Integration document
  */
  static async saveMessengerConfigs(_id, messengerData) {
    await this.update({ _id }, { $set: { messengerData } }, { runValidators: true });
    return this.findOne({ _id });
  }

  /**
   * Remove all messenger integrations
   * @return {Null}
   */
  static async removeIntegrations() {
    const integrations = await this.find({ kind: KIND_CHOICES.MESSENGER }, { _id: 1 });
    for (const integration of integrations) {
      await this.removeIntegration(integration._id);
    }
  }
}

class TwitterIntegration extends Integration {
  /**
   * Create or get a customer document
   * @param {string} integrationId - Integration id
   * @param {Object} user - User object
   * @param {string} user.id - User id
   * @param {string} user.name - User name
   * @param {string} user.id_str - user id
   * @param {string} user.screen_name - User screen name
   * @param {string} user.profile_image_url - url for profile image
   * @return {Promise} return Customer document
   */
  static async getOrCreateCustomer(integrationId, user) {
    const customer = Customers.findOne({
      integrationId,
      'twitterData.id': user.id,
    });

    return (
      (await customer) ||
      (await Customers.create({
        name: user.name,
        integrationId,
        twitterData: {
          id: user.id,
          idStr: user.id_str,
          name: user.name,
          screenName: user.screen_name,
          profileImageUrl: user.profile_image_url,
        },
      }))
    );
  }
}

class FacebookIntegration extends Integration {
  /**
   *
   *
   */
}

IntegrationSchema.loadClass(Integration);
FormIntegrationSchema.loadClass(FormIntegration);
MessengerIntegrationSchema.loadClass(MessengerIntegration);
TwitterIntegrationSchema.loadClass(TwitterIntegration);
FacebookIntegrationSchema.loadClass(FacebookIntegration);

export const Integrations = mongoose.model('Integrations', IntegrationSchema, 'integrations');

export const FormIntegrations = mongoose.model(
  'FormIntegrations',
  FormIntegrationSchema,
  'integrations',
);

export const MessengerIntegrations = mongoose.model(
  'MessengerIntegrations',
  MessengerIntegrationSchema,
  'integrations',
);

export const TwitterIntegrations = mongoose.model(
  'TwitterIntegrations',
  TwitterIntegrationSchema,
  'integrations',
);

export const FacebookIntegrations = mongoose.model(
  'FacebookIntegrations',
  FacebookIntegrationSchema,
  'integrations',
);
