import { ActivityLogs, GrowthHacks, Stages } from '../../../db/models';
import { getNewOrder } from '../../../db/models/boardUtils';
import { IItemDragCommonFields } from '../../../db/models/definitions/boards';
import { BOARD_STATUSES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IGrowthHack } from '../../../db/models/definitions/growthHacks';
import { IUserDocument } from '../../../db/models/definitions/users';
import { graphqlPubsub } from '../../../pubsub';
import { MODULE_NAMES } from '../../constants';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds } from '../../utils';
import {
  copyChecklists,
  IBoardNotificationParams,
  itemsChange,
  itemStatusChange,
  prepareBoardItemDoc,
  sendNotifications,
} from '../boardUtils';

interface IGrowthHacksEdit extends IGrowthHack {
  _id: string;
}

const growthHackMutations = {
  /**
   * Create new growth hack
   */
  async growthHacksAdd(_root, doc: IGrowthHack & { proccessId: string; aboveItemId: string }, { user, docModifier }: IContext) {
    doc.initialStageId = doc.stageId;
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
      order: await getNewOrder({ collection: GrowthHacks, stageId: doc.stageId, aboveItemId: doc.aboveItemId }),
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

    await putCreateLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        newData: {
          ...extendedDoc,
          createdAt: growthHack.createdAt,
          modifiedAt: growthHack.modifiedAt,
          order: growthHack.order,
        },
        object: growthHack,
      },
      user,
    );

    const stage = await Stages.getStage(growthHack.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId: doc.proccessId,
        action: 'itemAdd',
        data: {
          item: growthHack,
          aboveItemId: doc.aboveItemId,
          destinationStageId: stage._id,
        },
      },
    });

    return growthHack;
  },

  /**
   * Edit a growth hack
   */
  async growthHacksEdit(_root, { _id, proccessId, ...doc }: IGrowthHacksEdit & { proccessId: string }, { user }) {
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

    const stage = await Stages.getStage(updatedGrowthHack.stageId);

    if (doc.status && oldGrowthHack.status && oldGrowthHack.status !== doc.status) {
      const activityAction = doc.status === 'active' ? 'activated' : 'archived';

      await ActivityLogs.createArchiveLog({
        item: updatedGrowthHack,
        contentType: 'growthHack',
        action: activityAction,
        userId: user._id,
      });

      // order notification
      const { publishAction, data } = await itemStatusChange({
        type: 'task', item: updatedGrowthHack, status: activityAction
      });

      graphqlPubsub.publish('pipelinesChanged', {
        pipelinesChanged: {
          _id: stage.pipelineId,
          proccessId,
          action: publishAction,
          data,
        },
      });
    }

    if (doc.assignedUserIds && doc.assignedUserIds.length > 0 && oldGrowthHack.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(
        oldGrowthHack.assignedUserIds || [],
        doc.assignedUserIds || [],
      );

      const activityContent = { addedUserIds, removedUserIds };

      await ActivityLogs.createAssigneLog({
        contentId: _id,
        userId: user._id,
        contentType: 'growthHack',
        content: activityContent,
      });

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        object: oldGrowthHack,
        newData: extendedDoc,
        updatedDocument: updatedGrowthHack,
      },
      user,
    );

    if (oldGrowthHack.stageId === updatedGrowthHack.stageId) {
      graphqlPubsub.publish('growthHacksChanged', {
        growthHacksChanged: updatedGrowthHack,
      });

      return updatedGrowthHack;
    }

    // if growth hack moves between stages
    const { content, action } = await itemsChange(
      user._id,
      oldGrowthHack,
      MODULE_NAMES.GROWTH_HACK,
      updatedGrowthHack.stageId,
    );

    await sendNotifications({
      item: updatedGrowthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_CHANGE,
      content,
      action,
      contentType: MODULE_NAMES.GROWTH_HACK,
    });

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'orderUpdated',
        data: {
          item: updatedGrowthHack,
        },
      },
    });

    return updatedGrowthHack;
  },

  /**
   * Change a growth hack
   */
  async growthHacksChange(_root, doc: IItemDragCommonFields, { user }: IContext) {
    const { proccessId, itemId, aboveItemId, destinationStageId, sourceStageId } = doc

    const growthHack = await GrowthHacks.getGrowthHack(itemId);

    const extendedDoc = {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
      order: await getNewOrder({ collection: GrowthHacks, stageId: destinationStageId, aboveItemId }),
    };

    const updatedGrowthHack = await GrowthHacks.updateGrowthHack(itemId, extendedDoc);

    const { content, action } = await itemsChange(user._id, growthHack, MODULE_NAMES.GROWTH_HACK, destinationStageId);

    await sendNotifications({
      item: growthHack,
      user,
      type: NOTIFICATION_TYPES.GROWTHHACK_CHANGE,
      content,
      action,
      contentType: MODULE_NAMES.GROWTH_HACK,
    });

    await putUpdateLog(
      {
        type: MODULE_NAMES.GROWTH_HACK,
        object: growthHack,
        newData: extendedDoc,
        updatedDocument: updatedGrowthHack,
      },
      user,
    );

    // order notification
    const stage = await Stages.getStage(growthHack.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'orderUpdated',
        data: {
          item: growthHack,
          aboveItemId,
          destinationStageId,
          oldStageId: sourceStageId,
        },
      },
    });


    return growthHack;
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

    await putDeleteLog({ type: MODULE_NAMES.GROWTH_HACK, object: growthHack }, user);

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

  async growthHacksCopy(_root, { _id, proccessId }: { _id: string; proccessId: string }, { user }: IContext) {
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

    // order notification
    const stage = await Stages.getStage(clone.stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'itemAdd',
        data: {
          item: clone,
          aboveItemId: _id,
          destinationStageId: stage._id,
        },
      },
    });

    return clone;
  },

  async growthHacksArchive(_root, { stageId, proccessId }: { stageId: string, proccessId: string }, { user }: IContext) {
    const growthHacks = await GrowthHacks.find({stageId, status: {$ne: BOARD_STATUSES.ARCHIVED}});

    await GrowthHacks.updateMany({ stageId }, { $set: { status: BOARD_STATUSES.ARCHIVED } });

    for ( const growthHack of growthHacks) {
      await ActivityLogs.createArchiveLog({
        item: growthHack,
        contentType: 'growthHack',
        action: 'archived',
        userId: user._id,
      });
    }

    // order notification
    const stage = await Stages.getStage(stageId);

    graphqlPubsub.publish('pipelinesChanged', {
      pipelinesChanged: {
        _id: stage.pipelineId,
        proccessId,
        action: 'itemsRemove',
        data: {
          destinationStageId: stage._id,
        },
      },
    });

    return 'ok';
  },
};

checkPermission(growthHackMutations, 'growthHacksAdd', 'growthHacksAdd');
checkPermission(growthHackMutations, 'growthHacksEdit', 'growthHacksEdit');
checkPermission(growthHackMutations, 'growthHacksRemove', 'growthHacksRemove');
checkPermission(growthHackMutations, 'growthHacksWatch', 'growthHacksWatch');
checkPermission(growthHackMutations, 'growthHacksArchive', 'growthHacksArchive');

export default growthHackMutations;
