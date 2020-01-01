import * as _ from 'underscore';
import { ActivityLogs, GrowthHacks, Stages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IGrowthHack } from '../../../db/models/definitions/growthHacks';
import { IUserDocument } from '../../../db/models/definitions/users';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { checkUserIds, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { IBoardNotificationParams, itemsChange, sendNotifications } from '../boardUtils';
import { gatherLabelNames, gatherStageNames, gatherUsernames, gatherUsernamesOfBoardItem, LogDesc } from './logUtils';

interface IGrowthHacksEdit extends IGrowthHack {
  _id: string;
}

const growthHackMutations = {
  /**
   * Create new growth hack
   */
  async growthHacksAdd(_root, doc: IGrowthHack, { user }: { user: IUserDocument }) {
    doc.initialStageId = doc.stageId;
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...doc,
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

    let extraDesc: LogDesc[] = await gatherUsernamesOfBoardItem(growthHack);

    // stage names
    const stage = await Stages.findOne({ _id: doc.stageId });

    if (stage) {
      extraDesc.push({ stageId: stage._id, name: stage.name });
      extraDesc.push({ initialStageId: stage._id, name: stage.name });
    }

    if (doc.votedUserIds && doc.votedUserIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: doc.votedUserIds,
        foreignKey: 'votedUserIds',
        prevList: extraDesc,
      });
    }

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

    let extraDesc: LogDesc[] = await gatherUsernamesOfBoardItem(oldGrowthHack, updatedGrowthHack);

    // gather stage names
    const stageIds: string[] = [oldGrowthHack.stageId];

    if (doc.stageId !== oldGrowthHack.stageId) {
      stageIds.push(doc.stageId);
    }

    if (stageIds.length > 0) {
      extraDesc = await gatherStageNames({
        idFields: stageIds,
        foreignKey: 'stageId',
        prevList: extraDesc,
      });
    }

    if (oldGrowthHack.initialStageId) {
      extraDesc = await gatherStageNames({
        idFields: [oldGrowthHack.initialStageId],
        foreignKey: 'initialStageId',
        prevList: extraDesc,
      });
    }

    // gather voted users
    let votedUserIds: string[] = [];

    if (oldGrowthHack.votedUserIds) {
      votedUserIds = oldGrowthHack.votedUserIds;
    }

    if (doc.votedUserIds) {
      votedUserIds = votedUserIds.concat(doc.votedUserIds);
    }

    votedUserIds = _.uniq(votedUserIds);
    votedUserIds = _.compact(votedUserIds);

    if (votedUserIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: votedUserIds,
        foreignKey: 'votedUserIds',
        prevList: extraDesc,
      });
    }

    // gather label names
    if (oldGrowthHack.labelIds && oldGrowthHack.labelIds.length > 0) {
      extraDesc = await gatherLabelNames({
        idFields: oldGrowthHack.labelIds,
        foreignKey: 'labelIds',
        prevList: extraDesc,
      });
    }

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
    let extraDesc: LogDesc[] = await gatherUsernamesOfBoardItem(growthHack);

    extraDesc = await gatherStageNames({
      idFields: [growthHack.stageId],
      foreignKey: 'stageId',
      prevList: extraDesc,
    });

    if (growthHack.initialStageId) {
      extraDesc = await gatherStageNames({
        idFields: [growthHack.initialStageId],
        foreignKey: 'initialStageId',
        prevList: extraDesc,
      });
    }

    if (growthHack.labelIds && growthHack.labelIds.length > 0) {
      extraDesc = await gatherLabelNames({
        idFields: growthHack.labelIds,
        foreignKey: 'labelIds',
        prevList: extraDesc,
      });
    }

    if (growthHack.votedUserIds && growthHack.votedUserIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: growthHack.votedUserIds,
        foreignKey: 'votedUserIds',
        prevList: extraDesc,
      });
    }

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
};

checkPermission(growthHackMutations, 'growthHacksAdd', 'growthHacksAdd');
checkPermission(growthHackMutations, 'growthHacksEdit', 'growthHacksEdit');
checkPermission(growthHackMutations, 'growthHacksUpdateOrder', 'growthHacksUpdateOrder');
checkPermission(growthHackMutations, 'growthHacksRemove', 'growthHacksRemove');
checkPermission(growthHackMutations, 'growthHacksWatch', 'growthHacksWatch');

export default growthHackMutations;
