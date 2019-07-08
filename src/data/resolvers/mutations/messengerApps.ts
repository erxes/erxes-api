import { Forms, MessengerApps } from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { requireLogin } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog } from '../../utils';

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
      await putCreateLog(
        {
          type: 'messengerAppKb',
          newData: JSON.stringify(params),
          object: JSON.stringify(kb),
          description: `${name} has been created`,
        },
        user,
      );
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
      await putCreateLog(
        {
          type: 'messengerAppLead',
          newData: JSON.stringify(params),
          object: JSON.stringify(lead),
          description: `${name} has been created`,
        },
        user,
      );
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
      await putDeleteLog(
        {
          type: 'messengerApp',
          object: JSON.stringify(messengerApp),
          description: `${messengerApp.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

requireLogin(messengerAppMutations, 'messengerAppsAddKnowledgebase');
requireLogin(messengerAppMutations, 'messengerAppsAddLead');

export default messengerAppMutations;
