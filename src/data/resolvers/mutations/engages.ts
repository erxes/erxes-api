import { IEngageMessage } from '../../../db/models/definitions/engages';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { send } from './engageUtils';

interface IEngageMessageEdit extends IEngageMessage {
  _id: string;
}

const engageMutations = {
  /**
   * Create new message
   */
  async engageMessageAdd(
    _root,
    doc: IEngageMessage,
    { user, dataSources: { EngagesAPI } }: { user: IUserDocument; dataSources: { EngagesAPI: any } },
  ) {
    const engageMessage = await send(doc, EngagesAPI);

    if (engageMessage) {
      await putCreateLog(
        {
          type: 'engage',
          newData: JSON.stringify(doc),
          object: engageMessage,
          description: `${engageMessage.title} has been created`,
        },
        user,
      );
    }

    return engageMessage;
  },

  /**
   * Edit message
   */
  async engageMessageEdit(
    _root,
    { _id, ...doc }: IEngageMessageEdit,
    { user, dataSources }: { user: IUserDocument; dataSources: any },
  ) {
    const engageMessage = await dataSources.EngagesAPI.updateEngage(_id, doc);

    console.log('ENGAGE MESSAGE', engageMessage);

    if (engageMessage) {
      await putUpdateLog(
        {
          type: 'engage',
          object: engageMessage,
          newData: JSON.stringify(engageMessage),
          description: `${engageMessage.title} has been edited`,
        },
        user,
      );
    }

    return engageMessage;
  },

  /**
   * Remove message
   */
  async engageMessageRemove(
    _root,
    { _id }: { _id: string },
    { user, dataSources }: { user: IUserDocument; dataSources: any },
  ) {
    const engageMessage = await dataSources.EngagesAPI.removeEngage(_id);

    if (engageMessage) {
      await putDeleteLog(
        {
          type: 'engage',
          object: engageMessage,
          description: `${engageMessage.title} has been removed`,
        },
        user,
      );
    }

    return engageMessage;
  },

  /**
   * Engage message set live
   */
  async engageMessageSetLive(_root, { _id }: { _id: string }, { dataSources }) {
    return dataSources.EngagesAPI.engageMessageSetLive(_id);
  },

  /**
   * Engage message set pause
   */
  engageMessageSetPause(_root, { _id }: { _id: string }, { dataSources }) {
    return dataSources.EngagesAPI.engageMessageSetPause(_id);
  },

  /**
   * Engage message set live manual
   */
  async engageMessageSetLiveManual(_root, { _id }: { _id: string }, { dataSources }) {
    return dataSources.EngageAPI.engageMessageSetLive(_id);
  },
};

checkPermission(engageMutations, 'engageMessageAdd', 'engageMessageAdd');
checkPermission(engageMutations, 'engageMessageEdit', 'engageMessageEdit');
checkPermission(engageMutations, 'engageMessageRemove', 'engageMessageRemove');
checkPermission(engageMutations, 'engageMessageSetLive', 'engageMessageSetLive');
checkPermission(engageMutations, 'engageMessageSetPause', 'engageMessageSetPause');
checkPermission(engageMutations, 'engageMessageSetLiveManual', 'engageMessageSetLiveManual');

export default engageMutations;
