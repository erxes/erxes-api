import * as _ from 'underscore';
import { EngageMessages } from '../../../db/models';
import { IEngageMessage } from '../../../db/models/definitions/engages';
import { MESSAGE_KINDS, MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { send } from './engageUtils';
import { gatherBrandNames, gatherSegmentNames, gatherTagNames, gatherUsernames, LogDesc } from './logUtils';

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

    let extraDesc: LogDesc[] = [];

    if (doc.segmentIds && doc.segmentIds.length > 0) {
      extraDesc = await gatherSegmentNames({
        idFields: doc.segmentIds,
        foreignKey: 'segmentIds',
      });
    }

    if (doc.brandIds && doc.brandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: doc.brandIds,
        foreignKey: 'brandIds',
        prevList: extraDesc,
      });
    }

    if (doc.fromUserId) {
      extraDesc = await gatherUsernames({
        idFields: [doc.fromUserId],
        foreignKey: 'fromUserId',
        prevList: extraDesc,
      });
    }

    if (doc.messenger && doc.messenger.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [doc.messenger.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.ENGAGE,
        newData: JSON.stringify({
          ...doc,
          ...emptyCustomers,
        }),
        object: {
          ...engageMessage.toObject(),
          ...emptyCustomers,
        },
        description: `"${engageMessage.title}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
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

    let extraDesc: LogDesc[] = [];

    // gather unique segment names
    let segmentIds: string[] = engageMessage.segmentIds || [];

    if (doc.segmentIds && doc.segmentIds.length > 0) {
      segmentIds = segmentIds.concat(doc.segmentIds);
    }

    if (segmentIds.length > 0) {
      segmentIds = _.uniq(segmentIds);

      extraDesc = await gatherSegmentNames({
        idFields: segmentIds,
        foreignKey: 'segmentIds',
      });
    }

    // gather unique brand names
    let brandIds: string[] = engageMessage.brandIds || [];

    if (doc.brandIds && doc.brandIds.length > 0) {
      brandIds = brandIds.concat(doc.brandIds);
    }

    if (brandIds.length > 0) {
      brandIds = _.uniq(brandIds);

      extraDesc = await gatherBrandNames({
        idFields: brandIds,
        foreignKey: 'brandIds',
        prevList: extraDesc,
      });
    }

    let tagIds: string[] = engageMessage.tagIds || [];

    if (doc.tagIds && doc.tagIds.length > 0) {
      tagIds = tagIds.concat(doc.tagIds);
    }

    if (tagIds.length > 0) {
      tagIds = _.uniq(tagIds);

      extraDesc = await gatherTagNames({
        idFields: tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    const userIds: string[] = [];

    if (engageMessage.fromUserId) {
      userIds.push(engageMessage.fromUserId);
    }

    if (doc.fromUserId && doc.fromUserId !== engageMessage.fromUserId) {
      userIds.push(doc.fromUserId);
    }

    if (userIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: userIds,
        foreignKey: 'fromUserId',
        prevList: extraDesc,
      });
    }

    // gather unique messenger brands
    let msngrBrands: string[] = [];

    if (engageMessage.messenger && engageMessage.messenger.brandId) {
      msngrBrands.push(engageMessage.messenger.brandId);
    }

    if (doc.messenger && doc.messenger.brandId) {
      msngrBrands.push(doc.messenger.brandId);
    }

    if (msngrBrands.length > 0) {
      msngrBrands = _.uniq(msngrBrands);

      extraDesc = await gatherBrandNames({
        idFields: msngrBrands,
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.ENGAGE,
        object: { ...engageMessage.toObject(), ...emptyCustomers },
        newData: JSON.stringify({ ...updated.toObject(), ...emptyCustomers }),
        description: `"${engageMessage.title}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
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

    let extraDesc: LogDesc[] = [];

    if (engageMessage.segmentIds && engageMessage.segmentIds.length > 0) {
      extraDesc = await gatherSegmentNames({
        idFields: engageMessage.segmentIds,
        foreignKey: 'segmentIds',
      });
    }

    if (engageMessage.brandIds && engageMessage.brandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: engageMessage.brandIds,
        foreignKey: 'brandIds',
        prevList: extraDesc,
      });
    }

    if (engageMessage.tagIds && engageMessage.tagIds.length > 0) {
      extraDesc = await gatherTagNames({
        idFields: engageMessage.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    if (engageMessage.fromUserId) {
      extraDesc = await gatherUsernames({
        idFields: [engageMessage.fromUserId],
        foreignKey: 'fromUserId',
        prevList: extraDesc,
      });
    }

    if (engageMessage.messenger && engageMessage.messenger.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [engageMessage.messenger.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.ENGAGE,
        object: { ...engageMessage.toObject(), ...emptyCustomers },
        description: `"${engageMessage.title}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
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

  engagesConfigSave(_root, args, { dataSources }: IContext) {
    return dataSources.EngagesAPI.engagesConfigSave(args);
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
