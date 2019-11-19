import { Integrations } from '../../../db/models';
import { IIntegration, IMessengerData, IUiOptions } from '../../../db/models/definitions/integrations';
import { IExternalIntegrationParams, IMessengerIntegration } from '../../../db/models/Integrations';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IEditMessengerIntegration extends IMessengerIntegration {
  _id: string;
}

interface IEditLeadIntegration extends IIntegration {
  _id: string;
}

const integrationMutations = {
  /**
   * Create a new messenger integration
   */
  async integrationsCreateMessengerIntegration(_root, doc: IMessengerIntegration, { user }: IContext) {
    const integration = await Integrations.createMessengerIntegration(doc, user._id);

    await putCreateLog(
      {
        type: 'messengerIntegration',
        newData: JSON.stringify(doc),
        object: integration,
        description: `${integration.name} has been created`,
      },
      user,
    );

    return integration;
  },

  /**
   * Update messenger integration
   */
  async integrationsEditMessengerIntegration(_root, { _id, ...fields }: IEditMessengerIntegration, { user }: IContext) {
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
  async integrationsCreateLeadIntegration(_root, doc: IIntegration, { user }: IContext) {
    const integration = await Integrations.createLeadIntegration(doc, user._id);

    await putCreateLog(
      {
        type: 'leadIntegration',
        newData: JSON.stringify(doc),
        object: integration,
        description: `${integration.name} has been created`,
      },
      user,
    );

    return integration;
  },

  /**
   * Edit a lead integration
   */
  integrationsEditLeadIntegration(_root, { _id, ...doc }: IEditLeadIntegration) {
    return Integrations.updateLeadIntegration(_id, doc);
  },

  /*
   * Create external integrations like twitter, facebook, gmail etc ...
   */
  async integrationsCreateExternalIntegration(
    _root,
    { data, ...doc }: IExternalIntegrationParams & { data: object },
    { user, dataSources }: IContext,
  ) {
    const integration = await Integrations.createExternalIntegration(doc, user._id);

    let kind = doc.kind;

    if (kind.includes('nylas')) {
      kind = 'nylas';
    }

    if (kind.includes('facebook')) {
      kind = 'facebook';
    }

    if (kind === 'twitter-dm') {
      kind = 'twitter';
    }

    try {
      await dataSources.IntegrationsAPI.createIntegration(kind, {
        accountId: doc.accountId,
        kind: doc.kind,
        integrationId: integration._id,
        data: data ? JSON.stringify(data) : '',
      });

      await putCreateLog(
        {
          type: `${kind}Integration`,
          newData: JSON.stringify(doc),
          object: integration,
          description: `${integration.name} has been created`,
        },
        user,
      );
    } catch (e) {
      await Integrations.remove({ _id: integration._id });
      throw new Error(e);
    }

    return integration;
  },

  async integrationsEditCommonFields(_root, { _id, name, brandId }, { user }) {
    if (!(_id && name && brandId)) {
      throw new Error('Name and brand must be chosen.');
    }

    const integration = await Integrations.findOne({ _id });

    const updated = Integrations.updateBasicInfo(_id, { name, brandId });

    if (integration) {
      await putUpdateLog(
        {
          type: 'integration',
          object: { name: integration.name, brandId: integration.brandId },
          newData: JSON.stringify({ name, brandId }),
          description: `${integration.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Create IMAP account
   */
  async integrationAddImapAccount(_root, data, { dataSources }) {
    return dataSources.IntegrationsAPI.createAccount(data);
  },

  /**
   * Create Yahoo, Outlook account
   */
  async integrationAddMailAccount(_root, data, { dataSources }) {
    return dataSources.IntegrationsAPI.createAccount(data);
  },

  /**
   * Delete an integration
   */
  async integrationsRemove(_root, { _id }: { _id: string }, { user, dataSources }: IContext) {
    const integration = await Integrations.findOne({ _id });

    if (integration) {
      if (
        [
          'facebook-messenger',
          'facebook-post',
          'gmail',
          'callpro',
          'nylas-gmail',
          'nylas-imap',
          'nylas-office365',
          'nylas-outlook',
          'nylas-yahoo',
          'chatfuel',
          'twitter-dm',
        ].includes(integration.kind || '')
      ) {
        await dataSources.IntegrationsAPI.removeIntegration({ integrationId: _id });
      }

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
  async integrationsRemoveAccount(_root, { _id }: { _id: string }, { dataSources }: IContext) {
    const { erxesApiIds } = await dataSources.IntegrationsAPI.removeAccount({ _id });

    for (const id of erxesApiIds) {
      await Integrations.removeIntegration(id);
    }

    return 'success';
  },

  /**
   * Send mail
   */
  async integrationSendMail(_root, args: any, { dataSources }: IContext) {
    const { erxesApiId, ...doc } = args;

    let kind = doc.kind;

    if (kind.includes('nylas')) {
      kind = 'nylas';
    }

    return dataSources.IntegrationsAPI.sendEmail(kind, {
      erxesApiId,
      data: JSON.stringify(doc),
    });
  },

  async integrationsArchive(_root, { _id }: { _id: string }, { user }: IContext) {
    const integration = await Integrations.findOne({ _id });
    await Integrations.updateOne({ _id }, { $set: { isActive: false } });

    if (integration) {
      await putUpdateLog(
        {
          type: 'integration',
          object: integration,
          newData: JSON.stringify({ isActive: false }),
          description: `Integration "${integration.name}" has been archived.`,
        },
        user,
      );
    }

    return Integrations.findOne({ _id });
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
checkPermission(integrationMutations, 'integrationsCreateLeadIntegration', 'integrationsCreateLeadIntegration');
checkPermission(integrationMutations, 'integrationsEditLeadIntegration', 'integrationsEditLeadIntegration');
checkPermission(integrationMutations, 'integrationsRemove', 'integrationsRemove');
checkPermission(integrationMutations, 'integrationsArchive', 'integrationsArchive');
checkPermission(integrationMutations, 'integrationsEdit', 'integrationsEdit');

export default integrationMutations;
