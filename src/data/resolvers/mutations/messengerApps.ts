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
};

requireLogin(messengerAppMutations, 'messengerAppsEdit');
requireLogin(messengerAppMutations, 'messengerAppsAdd');

export default messengerAppMutations;
