import * as _ from 'underscore';
import { EngageMessages } from '../../../db/models';
import { IEngageMessage } from '../../../db/models/definitions/engages';
import { MESSAGE_KINDS, MODULE_NAMES } from '../../constants';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils from '../../utils';
import { send } from './engageUtils';

interface IEngageMessageEdit extends IEngageMessage {
  _id: string;
}

/**
 * These fields contain too much data & it's inappropriate
 * to save such data in each log row
 */
const emptyCustomers = {
  customerIds: [],
  messengerReceivedCustomerIds: [],
};

const engageMutations = {
  /**
   * Create new message
   */
  async engageMessageAdd(_root, doc: IEngageMessage, { user, docModifier }: IContext) {
    const engageMessage = await EngageMessages.createEngageMessage(docModifier(doc));

    await send(engageMessage);

    await putCreateLog(
      {
        type: MODULE_NAMES.ENGAGE,
        newData: {
          ...doc,
          ...emptyCustomers,
        },
        object: {
          ...engageMessage.toObject(),
          ...emptyCustomers,
        },
      },
      user,
    );

    return engageMessage;
  },

  /**
   * Edit message
   */
  async engageMessageEdit(_root, { _id, ...doc }: IEngageMessageEdit, { user }: IContext) {
    const engageMessage = await EngageMessages.getEngageMessage(_id);
    const updated = await EngageMessages.updateEngageMessage(_id, doc);

    try {
      await utils.fetchCronsApi({ path: '/update-or-remove-schedule', method: 'POST', body: { _id, update: 'true' } });
    } catch (e) {
      throw new Error(e);
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.ENGAGE,
        object: { ...engageMessage.toObject(), ...emptyCustomers },
        newData: { ...updated.toObject(), ...emptyCustomers },
        updatedDocument: updated,
      },
      user,
    );

    return EngageMessages.findOne({ _id });
  },

  /**
   * Remove message
   */
  async engageMessageRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const engageMessage = await EngageMessages.getEngageMessage(_id);

    try {
      await utils.fetchCronsApi({ path: '/update-or-remove-schedule', method: 'POST', body: { _id } });
    } catch (e) {
      throw new Error(e);
    }

    const removed = await EngageMessages.removeEngageMessage(_id);

    await putDeleteLog(
      {
        type: MODULE_NAMES.ENGAGE,
        object: { ...engageMessage.toObject(), ...emptyCustomers },
      },
      user,
    );

    return removed;
  },

  /**
   * Engage message set live
   */
  async engageMessageSetLive(_root, { _id }: { _id: string }) {
    const engageMessage = await EngageMessages.engageMessageSetLive(_id);

    const { kind } = engageMessage;

    if (kind !== MESSAGE_KINDS.MANUAL) {
      try {
        await utils.fetchCronsApi({
          path: '/create-schedule',
          method: 'POST',
          body: { message: JSON.stringify(engageMessage) },
        });
      } catch (e) {
        throw new Error(e);
      }
    }

    return engageMessage;
  },

  /**
   * Engage message set pause
   */
  engageMessageSetPause(_root, { _id }: { _id: string }) {
    return EngageMessages.engageMessageSetPause(_id);
  },

  /**
   * Engage message set live manual
   */
  engageMessageSetLiveManual(_root, { _id }: { _id: string }) {
    return EngageMessages.engageMessageSetLive(_id);
  },

  engagesUpdateConfigs(_root, configsMap, { dataSources }: IContext) {
    return dataSources.EngagesAPI.engagesUpdateConfigs(configsMap);
  },

  /**
   * Engage message verify email
   */
  engageMessageVerifyEmail(_root, { email }: { email: string }, { dataSources }: IContext) {
    return dataSources.EngagesAPI.engagesVerifyEmail({ email });
  },

  /**
   * Engage message remove verified email
   */
  engageMessageRemoveVerifiedEmail(_root, { email }: { email: string }, { dataSources }: IContext) {
    return dataSources.EngagesAPI.engagesRemoveVerifiedEmail({ email });
  },

  engageMessageSendTestEmail(_root, args, { dataSources }: IContext) {
    return dataSources.EngagesAPI.engagesSendTestEmail(args);
  },
};

checkPermission(engageMutations, 'engageMessageAdd', 'engageMessageAdd');
checkPermission(engageMutations, 'engageMessageEdit', 'engageMessageEdit');
checkPermission(engageMutations, 'engageMessageRemove', 'engageMessageRemove');
checkPermission(engageMutations, 'engageMessageSetLive', 'engageMessageSetLive');
checkPermission(engageMutations, 'engageMessageSetPause', 'engageMessageSetPause');
checkPermission(engageMutations, 'engageMessageSetLiveManual', 'engageMessageSetLiveManual');
checkPermission(engageMutations, 'engageMessageVerifyEmail', 'engageMessageRemove');
checkPermission(engageMutations, 'engageMessageRemoveVerifiedEmail', 'engageMessageRemove');
checkPermission(engageMutations, 'engageMessageSendTestEmail', 'engageMessageRemove');

export default engageMutations;
