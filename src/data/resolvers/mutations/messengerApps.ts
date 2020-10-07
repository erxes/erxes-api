import { Db } from 'mongodb';
import { MessengerApps } from '../../../db/models';
import { IMessengerApp } from '../../../db/models/definitions/messengerApps';
import { putDeleteLog } from '../../logUtils';
import { requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

type IMessengerAppEdit = IMessengerApp & { _id: string };

const messengerAppMutations = {
  messengerAppsEdit(_root, { _id, ...doc }: IMessengerAppEdit, { docModifier }: IContext) {
    return MessengerApps.updateApp(_id, docModifier(doc));
  },

  async messengerAppsAdd(_root, params: IMessengerApp, { docModifier }: IContext) {
    return MessengerApps.createApp(docModifier(params));
  },

  /*
   * Remove app
   */
  async messengerAppsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const messengerApp = await MessengerApps.getApp(_id);
    const removed = await MessengerApps.deleteOne({ _id });

    await putDeleteLog(
      {
        type: 'messengerApp',
        object: messengerApp,
        description: `${messengerApp.name} has been removed`,
      },
      user,
    );

    return removed;
  },

  async messengerAppSave(
    _root,
    { integrationId, messengerApps }: { integrationId: string; messengerApps: any },
    { docModifier }: IContext,
  ) {
    await MessengerApps.deleteMany({ 'credentials.integrationId': integrationId });

    if (messengerApps.websites) {
      for (const website of messengerApps.websites) {
        const doc = {
          kind: 'website',
          credentials: {
            integrationId,
            description: website.description,
            buttonText: website.buttonText,
            url: website.url,
          },
        };

        await MessengerApps.createApp(docModifier(doc));
      }
    }

    if (messengerApps.knowledgebases) {
      for (const knowledgebase of messengerApps.knowledgebases) {
        const doc = {
          kind: 'knowledgebase',
          credentials: {
            integrationId,
            topicId: knowledgebase.topicId,
          },
        };

        await MessengerApps.createApp(docModifier(doc));
      }
    }

    if (messengerApps.leads) {
      for (const lead of messengerApps.leads) {
        const doc = {
          kind: 'lead',
          credentials: {
            integrationId,
            formCode: lead.formCode,
          },
        };

        await MessengerApps.createApp(docModifier(doc));
      }
    }

    return 'success';
  },
};

requireLogin(messengerAppMutations, 'messengerAppsEdit');
requireLogin(messengerAppMutations, 'messengerAppsAdd');

export default messengerAppMutations;
