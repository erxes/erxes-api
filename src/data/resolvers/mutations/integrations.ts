import { Integrations } from '../../../db/models';
import { IIntegration, IMessengerData, IUiOptions } from '../../../db/models/definitions/integrations';
import { IUserDocument } from '../../../db/models/definitions/users';
import { IExternalIntegrationParams, IMessengerIntegration } from '../../../db/models/Integrations';
import { IntegrationsAPI } from '../../dataSources';
import { checkPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IEditMessengerIntegration extends IMessengerIntegration {
  _id: string;
}

interface IEditFormIntegration extends IIntegration {
  _id: string;
}

const integrationsApi = new IntegrationsAPI();

const integrationMutations = {
  /**
   * Create a new messenger integration
   */
  async integrationsCreateMessengerIntegration(_root, doc: IMessengerIntegration, { user }: { user: IUserDocument }) {
    const integration = await Integrations.createMessengerIntegration(doc);

    if (integration) {
      await putCreateLog(
        {
          type: 'integration',
          newData: JSON.stringify(doc),
          object: integration,
          description: `${integration.name} has been created`,
        },
        user,
      );
    }

    return integration;
  },

  /**
   * Update messenger integration
   */
  async integrationsEditMessengerIntegration(
    _root,
    { _id, ...fields }: IEditMessengerIntegration,
    { user }: { user: IUserDocument },
  ) {
    const integration = await Integrations.findOne({ _id });
    const updated = await Integrations.updateMessengerIntegration(_id, fields);

    if (integration) {
      await putUpdateLog(
        {
          type: 'integration',
          object: integration,
          newData: JSON.stringify(fields),
          description: `${integration.name} has been edited`,
        },
        user,
      );
    }

    return updated;
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
      await integrationsApi.createIntegration(doc.kind, {
        accountId: doc.accountId,
        integrationId: integration._id,
        data: data ? JSON.stringify(data) : '',
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
  async integrationsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const integration = await Integrations.findOne({ _id });

    if (integration) {
      await integrationsApi.removeIntegration({ integrationId: _id });

      await putDeleteLog(
        {
          type: 'integration',
          object: integration,
          description: `${integration.name} has been removed`,
        },
        user,
      );
    }

    return Integrations.removeIntegration(_id);
  },

  /**
   * Delete an account
   */
  async integrationsRemoveAccount(_root, { _id }: { _id: string }) {
    return integrationsApi.removeAccount({ _id });
  },

  /**
   * Send gmail
   */
  async integrationSendMail(_root, args: any) {
    const { erxesApiId, ...mailParams } = args;

    return integrationsApi.sendEmail({
      erxesApiId,
      data: JSON.stringify(mailParams),
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
