import { ActivityLogs, GrowthHacks } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IGrowthHack } from '../../../db/models/definitions/growthHacks';
import { IUserDocument } from '../../../db/models/definitions/users';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import {
  copyChecklists,
  IBoardNotificationParams,
  itemsChange,
  prepareBoardItemDoc,
  sendNotifications,
} from '../boardUtils';
import { gatherGHFieldNames, LogDesc } from './logUtils';

interface IGrowthHacksEdit extends IGrowthHack {
  _id: string;
}

const growthHackMutations = {
  /**
   * Create new growth hack
   */
  async growthHacksAdd(_root, doc: IGrowthHack, { user, docModifier }: IContext) {
    doc.initialStageId = doc.stageId;
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
    };

    const growthHack = await GrowthHacks.createGrowthHack(extendedDoc);

    await sendNotifications({
      item: growthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_ADD,
      action: 'invited you to the growthHack',
      content: `'${growthHack.name}'.`,
      contentType: MODULE_NAMES.GROWTH_HACK,
    });

    const extraDesc: LogDesc[] = await gatherGHFieldNames(growthHack);

    await putCreateLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        newData: JSON.stringify({
          ...extendedDoc,
          createdAt: growthHack.createdAt,
          modifiedAt: growthHack.modifiedAt,
          order: growthHack.order,
        }),
        object: growthHack,
        description: `"${growthHack.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return growthHack;
  },

  /**
   * Edit a growth hack
   */
  async growthHacksEdit(_root, { _id, ...doc }: IGrowthHacksEdit, { user }) {
    const oldGrowthHack = await GrowthHacks.getGrowthHack(_id);

    const extendedDoc = {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    };

    const updatedGrowthHack = await GrowthHacks.updateGrowthHack(_id, extendedDoc);

    const notificationDoc: IBoardNotificationParams = {
      item: updatedGrowthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_EDIT,
      action: `has updated a growth hack`,
      content: `${updatedGrowthHack.name}`,
      contentType: MODULE_NAMES.GROWTH_HACK,
    };

    if (doc.assignedUserIds && doc.assignedUserIds.length > 0 && oldGrowthHack.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(
        oldGrowthHack.assignedUserIds || [],
        doc.assignedUserIds || [],
      );

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    let extraDesc: LogDesc[] = await gatherGHFieldNames(oldGrowthHack);

    extraDesc = await gatherGHFieldNames(updatedGrowthHack, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        object: oldGrowthHack,
        newData: JSON.stringify(extendedDoc),
        description: `"${updatedGrowthHack.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updatedGrowthHack;
  },

  /**
   * Change a growth hack
   */
  async growthHacksChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: { user: IUserDocument },
  ) {
    const growthHack = await GrowthHacks.getGrowthHack(_id);

    await GrowthHacks.updateGrowthHack(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const { content, action } = await itemsChange(user._id, growthHack, MODULE_NAMES.GROWTH_HACK, destinationStageId);

    await sendNotifications({
      item: growthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_CHANGE,
      content,
      action,
      contentType: MODULE_NAMES.GROWTH_HACK,
    });

    return growthHack;
  },

  /**
   * Update growth hack orders (not sendNotifaction, ordered card to change)
   */
  growthHacksUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return GrowthHacks.updateOrder(stageId, orders);
  },

  /**
   * Remove a growth hack
   */
  async growthHacksRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const growthHack = await GrowthHacks.getGrowthHack(_id);

    await sendNotifications({
      item: growthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_DELETE,
      action: `deleted growth hack:`,
      content: `'${growthHack.name}'`,
      contentType: MODULE_NAMES.GROWTH_HACK,
    });

    await ActivityLogs.removeActivityLog(growthHack._id);

    const removed = growthHack.remove();

    // prepare log description
    const extraDesc: LogDesc[] = await gatherGHFieldNames(growthHack);

    await putDeleteLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        object: growthHack,
        description: `"${growthHack.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    await ActivityLogs.removeActivityLog(growthHack._id);

    return removed;
  },

  /**
   * Watch a growth hack
   */
  growthHacksWatch(_root, { _id, isAdd }: { _id: string; isAdd: boolean }, { user }: { user: IUserDocument }) {
    return GrowthHacks.watchGrowthHack(_id, isAdd, user._id);
  },

  /**
   * Vote a growth hack
   */
  growthHacksVote(_root, { _id, isVote }: { _id: string; isVote: boolean }, { user }: { user: IUserDocument }) {
    return GrowthHacks.voteGrowthHack(_id, isVote, user._id);
  },

  async growthHacksCopy(_root, { _id }: { _id: string }, { user }: IContext) {
    const growthHack = await GrowthHacks.getGrowthHack(_id);

    const doc = await prepareBoardItemDoc(_id, 'growthHack', user._id);

    doc.votedUserIds = growthHack.votedUserIds;
    doc.voteCount = growthHack.voteCount;
    doc.hackStages = growthHack.hackStages;
    doc.reach = growthHack.reach;
    doc.impact = growthHack.impact;
    doc.confidence = growthHack.confidence;
    doc.ease = growthHack.ease;

    const clone = await GrowthHacks.createGrowthHack(doc);

    await copyChecklists({
      contentType: 'growthHack',
      contentTypeId: growthHack._id,
      targetContentId: clone._id,
      user,
    });

    return clone;
  },
};

checkPermission(growthHackMutations, 'growthHacksAdd', 'growthHacksAdd');
checkPermission(growthHackMutations, 'growthHacksEdit', 'growthHacksEdit');
checkPermission(growthHackMutations, 'growthHacksUpdateOrder', 'growthHacksUpdateOrder');
checkPermission(growthHackMutations, 'growthHacksRemove', 'growthHacksRemove');
checkPermission(growthHackMutations, 'growthHacksWatch', 'growthHacksWatch');

export default growthHackMutations;
