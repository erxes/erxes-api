import { Customers, EmailDeliveries, Integrations } from '../../../db/models';
import { IIntegration, IMessengerData, IUiOptions } from '../../../db/models/definitions/integrations';
import { IExternalIntegrationParams } from '../../../db/models/Integrations';
import { debugExternalApi } from '../../../debuggers';
import { sendRPCMessage } from '../../../messageBroker';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherBrandNames, gatherFormNames, gatherTagNames, gatherUsernames, LogDesc } from './logUtils';

interface IEditIntegration extends IIntegration {
  _id: string;
}

const integrationMutations = {
  /**
   * Creates a new messenger integration
   */
  async integrationsCreateMessengerIntegration(_root, doc: IIntegration, { user }: IContext) {
    const integration = await Integrations.createMessengerIntegration(doc, user._id);

    let extraDesc: LogDesc[] = [{ createdUserId: user._id, name: user.username || user.email }];

    if (doc.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [doc.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.INTEGRATION,
        newData: JSON.stringify({ ...doc, createdUserId: user._id, isActive: true }),
        object: integration,
        description: `"${integration.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return integration;
  },

  /**
   * Updates a messenger integration
   */
  async integrationsEditMessengerIntegration(_root, { _id, ...fields }: IEditIntegration, { user }: IContext) {
    const integration = await Integrations.getIntegration(_id);
    const updated = await Integrations.updateMessengerIntegration(_id, fields);

    const brandIds: string[] = [];

    if (integration.brandId) {
      brandIds.push(integration.brandId);
    }

    if (fields.brandId && fields.brandId !== integration.brandId) {
      brandIds.push(fields.brandId);
    }

    let extraDesc: LogDesc[] = await gatherBrandNames({
      idFields: brandIds,
      foreignKey: 'brandId',
    });

    extraDesc = await gatherUsernames({
      idFields: [integration.createdUserId],
      foreignKey: 'createdUserId',
      prevList: extraDesc,
    });

    if (integration.tagIds && integration.tagIds.length > 0) {
      extraDesc = await gatherTagNames({
        idFields: integration.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    if (integration.formId) {
      extraDesc = await gatherFormNames({
        idFields: [integration.formId],
        foreignKey: 'formId',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.INTEGRATION,
        object: integration,
        newData: JSON.stringify(fields),
        description: `"${integration.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

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

    let extraDesc: LogDesc[] = [{ createdUserId: user._id, name: user.username || user.email }];

    if (doc.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [doc.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    if (doc.formId) {
      extraDesc = await gatherFormNames({
        idFields: [doc.formId],
        foreignKey: 'formId',
        prevList: extraDesc,
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.INTEGRATION,
        newData: JSON.stringify({ ...doc, createdUserId: user._id, isActive: true }),
        object: integration,
        description: `"${integration.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return integration;
  },

  /**
   * Edit a lead integration
   */
  integrationsEditLeadIntegration(_root, { _id, ...doc }: IEditIntegration) {
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

      let extraDesc: LogDesc[] = [{ createdUserId: user._id, name: user.username || user.email }];

      extraDesc = await gatherBrandNames({
        idFields: [doc.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });

      await putCreateLog(
        {
          type: MODULE_NAMES.INTEGRATION,
          newData: JSON.stringify({ ...doc, createdUserId: user._id, isActive: true }),
          object: integration,
          description: `"${integration.name}" has been created`,
          extraDesc: JSON.stringify(extraDesc),
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
    const integration = await Integrations.getIntegration(_id);

    const updated = Integrations.updateBasicInfo(_id, { name, brandId });

    const brandIds: string[] = [];

    if (integration.brandId) {
      brandIds.push(integration.brandId);
    }

    if (brandId !== integration.brandId) {
      brandIds.push(brandId);
    }

    const extraDesc: LogDesc[] = await gatherBrandNames({
      idFields: brandIds,
      foreignKey: 'brandId',
    });

    await putUpdateLog(
      {
        type: MODULE_NAMES.INTEGRATION,
        object: { name: integration.name, brandId: integration.brandId },
        newData: JSON.stringify({ name, brandId }),
        description: `"${integration.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Create IMAP account
   */
  integrationAddImapAccount(_root, data, { dataSources }) {
    return dataSources.IntegrationsAPI.createAccount(data);
  },

  /**
   * Create Yahoo, Outlook account
   */
  integrationAddMailAccount(_root, data, { dataSources }) {
    return dataSources.IntegrationsAPI.createAccount(data);
  },

  /**
   * Deletes an integration
   */
  async integrationsRemove(_root, { _id }: { _id: string }, { user, dataSources }: IContext) {
    const integration = await Integrations.getIntegration(_id);

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
      ].includes(integration.kind)
    ) {
      await dataSources.IntegrationsAPI.removeIntegration({ integrationId: _id });
    }

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [integration.createdUserId],
      foreignKey: 'createdUserId',
    });

    if (integration.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [integration.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    if (integration.tagIds && integration.tagIds.length > 0) {
      extraDesc = await gatherTagNames({
        idFields: integration.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    if (integration.formId) {
      extraDesc = await gatherFormNames({
        idFields: [integration.formId],
        foreignKey: 'formId',
        prevList: extraDesc,
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.INTEGRATION,
        object: integration,
        description: `"${integration.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return Integrations.removeIntegration(_id);
  },

  /**
   * Delete an account
   */
  async integrationsRemoveAccount(_root, { _id }: { _id: string }) {
    const { erxesApiIds } = await sendRPCMessage({ action: 'remove-account', data: { _id } });

    for (const id of erxesApiIds) {
      await Integrations.removeIntegration(id);
    }

    return 'success';
  },

  /**
   * Send mail
   */
  async integrationSendMail(_root, args: any, { dataSources, user }: IContext) {
    const { erxesApiId, ...doc } = args;

    let kind = doc.kind;

    if (kind.includes('nylas')) {
      kind = 'nylas';
    }

    try {
      await dataSources.IntegrationsAPI.sendEmail(kind, {
        erxesApiId,
        data: JSON.stringify(doc),
      });
    } catch (e) {
      debugExternalApi(e);
      throw new Error(e);
    }

    const customerIds = await Customers.find({ primaryEmail: { $in: doc.to } }).distinct('_id');

    doc.userId = user._id;

    for (const customerId of customerIds) {
      await EmailDeliveries.createEmailDelivery({ ...doc, customerId });
    }

    return;
  },

  async integrationsArchive(_root, { _id }: { _id: string }, { user }: IContext) {
    const integration = await Integrations.getIntegration(_id);

    await Integrations.updateOne({ _id }, { $set: { isActive: false } });

    await putUpdateLog(
      {
        type: 'integration',
        object: { isActive: integration.isActive },
        newData: JSON.stringify({ isActive: false }),
        description: `Integration "${integration.name}" has been archived.`,
      },
      user,
    );

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
checkPermission(integrationMutations, 'integrationsEditCommonFields', 'integrationsEdit');

export default integrationMutations;
