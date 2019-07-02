import { Integrations } from '../../../db/models';
import { IIntegration, IMessengerData, IUiOptions } from '../../../db/models/definitions/integrations';
import { IExternalIntegrationParams, IMessengerIntegration } from '../../../db/models/Integrations';
import { checkPermission } from '../../permissions/wrappers';
import { fetchIntegrationApi } from '../../utils';

interface IEditMessengerIntegration extends IMessengerIntegration {
  _id: string;
}

interface IEditFormIntegration extends IIntegration {
  _id: string;
}

const integrationMutations = {
  /**
   * Create a new messenger integration
   */
  integrationsCreateMessengerIntegration(_root, doc: IMessengerIntegration) {
    return Integrations.createMessengerIntegration(doc);
  },

  /**
   * Update messenger integration
   */
  integrationsEditMessengerIntegration(_root, { _id, ...fields }: IEditMessengerIntegration) {
    return Integrations.updateMessengerIntegration(_id, fields);
  },

  /**
   * Update/save messenger appearance data
   */
  integrationsSaveMessengerAppearanceData(_root, { _id, uiOptions }: { _id: string; uiOptions: IUiOptions }) {
    return Integrations.saveMessengerAppearanceData(_id, uiOptions);
  },

  /**
   * Update/save messenger data
   */
  integrationsSaveMessengerConfigs(_root, { _id, messengerData }: { _id: string; messengerData: IMessengerData }) {
    return Integrations.saveMessengerConfigs(_id, messengerData);
  },

  /**
   * Create a new messenger integration
   */
  integrationsCreateFormIntegration(_root, doc: IIntegration) {
    return Integrations.createFormIntegration(doc);
  },

  /**
   * Edit a form integration
   */
  integrationsEditFormIntegration(_root, { _id, ...doc }: IEditFormIntegration) {
    return Integrations.updateFormIntegration(_id, doc);
  },

  /*
   * Create external integrations like twitter, facebook, gmail etc ...
   */
  async integrationsCreateExternalIntegration(_root, { data, ...doc }: IExternalIntegrationParams & { data: object }) {
    const integration = await Integrations.createExternalIntegration(doc);

    try {
      await fetchIntegrationApi({
        path: `/${doc.kind}/create-integration`,
        method: 'POST',
        body: {
          accountId: doc.accountId,
          integrationId: integration._id,
          data: data ? JSON.stringify(data) : '',
        },
      });
    } catch (e) {
      await Integrations.remove({ _id: integration._id });
      throw new Error(e);
    }

    return integration;
  },

  /**
   * Delete an integration
   */
  async integrationsRemove(_root, { _id }: { _id: string }) {
    const integration = await Integrations.findOne({ _id });

    if (integration && integration.kind === 'facebook') {
      await fetchIntegrationApi({
        path: '/integrations/remove',
        method: 'POST',
        body: {
          integrationId: _id,
        },
      });
    }

    return Integrations.removeIntegration(_id);
  },

  /**
   * Delete an account
   */
  async integrationsRemoveAccount(_root, { _id }: { _id: string }) {
    return fetchIntegrationApi({ path: '/accounts/remove', method: 'post', body: { _id } });
  },

  /**
   * Send gmail
   */
  async integrationSendMail(_root, args: any) {
    const { erxesApiId, ...mailParams } = args;

    return fetchIntegrationApi({
      path: '/gmail/send',
      method: 'POST',
      body: {
        erxesApiId,
        data: JSON.stringify(mailParams),
      },
    });
  },
};

checkPermission(
  integrationMutations,
  'integrationsCreateMessengerIntegration',
  'integrationsCreateMessengerIntegration',
);
checkPermission(
  integrationMutations,
  'integrationsSaveMessengerAppearanceData',
  'integrationsSaveMessengerAppearanceData',
);
checkPermission(integrationMutations, 'integrationsSaveMessengerConfigs', 'integrationsSaveMessengerConfigs');
checkPermission(integrationMutations, 'integrationsCreateFormIntegration', 'integrationsCreateFormIntegration');
checkPermission(integrationMutations, 'integrationsEditFormIntegration', 'integrationsEditFormIntegration');
checkPermission(integrationMutations, 'integrationsRemove', 'integrationsRemove');

export default integrationMutations;
