import { Forms, MessengerApps } from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { requireLogin } from '../../permissions/wrappers';
import { putLog } from '../../utils';

const messengerAppMutations = {
  /**
   * Creates a messenger app knowledgebase
   * @param {string} params.name Name
   * @param {string} params.integrationId Integration
   * @param {string} params.topicId Topic
   */
  async messengerAppsAddKnowledgebase(_root, params, { user }: { user: IUserDocument }) {
    const { name, integrationId, topicId } = params;
    const kb = await MessengerApps.createApp({
      name,
      kind: 'knowledgebase',
      showInInbox: false,
      credentials: {
        integrationId,
        topicId,
      },
    });

    if (kb) {
      await putLog({
        createdBy: user._id,
        type: 'messengerAppKb',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(params),
        objectId: kb._id,
        unicode: user.username || user.email || user._id,
        description: `${name} has been created`,
      });
    }

    return kb;
  },

  /**
   * Creates a messenger app lead
   * @param {string} params.name Name
   * @param {string} params.integrationId Integration
   * @param {string} params.formId Form
   */
  async messengerAppsAddLead(_root, params, { user }: { user: IUserDocument }) {
    const { name, integrationId, formId } = params;
    const form = await Forms.findOne({ _id: formId });

    if (!form) {
      throw new Error('Form not found');
    }

    const lead = await MessengerApps.createApp({
      name,
      kind: 'lead',
      showInInbox: false,
      credentials: {
        integrationId,
        formCode: form.code || '',
      },
    });

    if (lead) {
      await putLog({
        createdBy: user._id,
        type: 'messengerAppLead',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(params),
        objectId: lead._id,
        unicode: user.username || user.email || user._id,
        description: `${name} has been created`,
      });
    }

    return lead;
  },

  /*
   * Remove app
   */
  async messengerAppsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const messengerApp = await MessengerApps.findOne({ _id });
    const removed = await MessengerApps.deleteOne({ _id });

    if (messengerApp) {
      await putLog({
        createdBy: user._id,
        type: 'messengerApp',
        action: LOG_ACTIONS.DELETE,
        oldData: JSON.stringify(messengerApp),
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${messengerApp.name} has been removed`,
      });
    }

    return removed;
  },
};

requireLogin(messengerAppMutations, 'messengerAppsAddKnowledgebase');
requireLogin(messengerAppMutations, 'messengerAppsAddLead');

export default messengerAppMutations;
