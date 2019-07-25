import { IEngageMessage } from '../../../db/models/definitions/engages';
import { IUserDocument } from '../../../db/models/definitions/users';
import { MESSAGE_KINDS } from '../../constants';
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

    await dataSources.CronsAPI.updateOrRemoveSchedule(_id, true);

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

    await dataSources.CronsAPI.updateOrRemoveSchedule(_id);

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
    const engageMessage = dataSources.EngagesAPI.engageMessageSetLive(_id);

    const { kind } = engageMessage;

    if (kind === MESSAGE_KINDS.AUTO || kind === MESSAGE_KINDS.VISITOR_AUTO) {
      dataSources.CronsAPI.createSchedule(JSON.stringify(engageMessage));
    }

    return engageMessage;
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
