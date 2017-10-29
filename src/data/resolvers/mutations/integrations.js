import { Integrations, TwitterIntegrations, FacebookIntegrations } from '../../../db/models';

import twitter from '../../integrations/twitter';

export default {
  /**
   * Add new facebook integration
   * @param {Object} doc - Facebook integration object
   * @param {string} doc.name - name
   * @param {string} doc.brandId - The id of the brand related integration
   * @param {string} doc.appId - Facebook app id
   * @param {String[]} doc.pageIds - Face page ids
   * @return {Promise} Returns Promise resolving facebook integration document
   */
  integrationsAddFacebookIntegration(root, { appId, pageIds, ...docFields }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return FacebookIntegrations.createIntegration({
      ...docFields,
      facebookData: {
        appId,
        pageIds,
      },
    });
  },

  /**
   * Add new twitter integration
   * @param {Object} doc - Twitter integration object
   * @param {Object} doc.queryParams - Object (dictionary)
   * @param {string} doc.brandId - The id of the related integration
   * @return {Promise}
   */
  async integrationsAddTwitterIntegration(root, { brandId, queryParams }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return new Promise(resolve => {
      twitter.authenticate(queryParams, async docFields => {
        const integration = await TwitterIntegrations.createIntegration({ brandId, ...docFields });
        await twitter.trackIntegration(integration);
        resolve(integration);
      });
    });
  },

  /**
   * Create a new messenger integration
   * @param {Object} root
   * @param {Object} doc - Integration main doc object
   * @param {string} doc.name - Integration name
   * @param {string} doc.brandId - Integration brand id
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsCreateMessengerIntegration(root, doc, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.createMessengerIntegration(doc);
  },

  /**
   * Update messenger integration
   * @param {Object} root
   * @param {string} object2  - Integration main document object
   * @param {string} object2._id - Integration id
   * @param {string} object2.name - Integration name
   * @param {string} object2.brandId - Integration brand id
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsEditMessengerIntegration(root, { _id, ...fields }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.updateMessengerIntegration(_id, fields);
  },

  /**
   * Update/save messenger appearance data
   * @param {Object} root
   * @param {Object} object2 Graphql input data
   * @param {string} object2._id - Integration id
   * @param {Object} object2 - MessengerUiOptions subdocument object
   * @param {string} object2.color - MessengerUiOptions color
   * @param {string} object2.wallpaper - MessengerUiOptions wallpaper
   * @param {string} object2.logo - MessengerUiOptions logo
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsSaveMessengerAppearanceData(root, { _id, uiOptions }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.saveMessengerAppearanceData(_id, uiOptions);
  },

  /**
   * Update/save messenger data
   * @param {Object} root
   * @param {Object} object2 - Graphql input data
   * @param {string} object2._id - Integration id
   * @param {MessengerData} object2.messengerData - MessengerData subdocument
   *     object related to this integration
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsSaveMessengerConfigs(root, { _id, messengerData }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.saveMessengerConfigs(_id, messengerData);
  },

  /**
   * Create a new messenger integration
   * @param {Object} root
   * @param {Object} doc - Integration object
   * @param {string} doc.name - Integration name
   * @param {string} doc.brandId - Integration brand id
   * @param {string} doc.formId - Integration form id
   * @param {FormData} doc.formData - Integration form data sumbdocument object
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsCreateFormIntegration(root, doc, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.createFormIntegration(doc);
  },

  /**
   * Edit a form integration
   * @param {Object}
   * @param {Object} doc - Integration object
   * @param {string} doc._id - Integration id
   * @param {string} doc.name - Integration name
   * @param {string} doc.brandId - Integration brand id
   * @param {string} doc.formId - Integration form id
   * @param {FormData} doc.formData - Integration form data subdocument object
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} return Promise resolving Integration document
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsEditFormIntegration(root, { _id, ...doc }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.updateFormIntegration(_id, doc);
  },

  /**
  * Delete an integration
   * @param {Object} root
   * @param {Object} object2 - Graphql input data
   * @param {string} object2._id - Integration id
   * @param {Object} object3 - The middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise}
   * @throws {Error} throws Error('Login required') if user is not logged in
   */
  integrationsRemove(root, { _id }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Integrations.removeIntegration(_id);
  },
};
