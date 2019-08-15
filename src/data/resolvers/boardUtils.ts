import { Boards, Pipelines, Stages } from '../../db/models';
import { NOTIFICATION_TYPES } from '../../db/models/definitions/constants';
import { IDealDocument } from '../../db/models/definitions/deals';
import { IUserDocument } from '../../db/models/definitions/users';
import { can } from '../permissions/utils';
import { checkLogin } from '../permissions/wrappers';
import utils from '../utils';

export const notifiedUserIds = async (item: any) => {
  let userIds: string[] = [];

  if (item.assignedUserIds && item.assignedUserIds.length > 0) {
    userIds = userIds.concat(item.assignedUserIds);
  }

  if (item.watchedUserIds && item.watchedUserIds.length > 0) {
    userIds = userIds.concat(item.watchedUserIds);
  }

  const stage = await Stages.getStage(item.stageId || '');
  const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

  if (pipeline.watchedUserIds && pipeline.watchedUserIds.length > 0) {
    userIds = userIds.concat(pipeline.watchedUserIds);
  }

  return userIds;
};

/**
 * Send notification to all members of this content except the sender
 */
export const sendNotifications = async ({
  item,
  user,
  type,
  action,
  content,
  contentType,
  invitedUsers,
  removedUsers,
}: {
  item: IDealDocument;
  user: IUserDocument;
  type: string;
  action?: string;
  content?: string;
  contentType: string;
  invitedUsers?: string[];
  removedUsers?: string[];
}) => {
  const stage = await Stages.findOne({ _id: item.stageId });

  if (!stage) {
    throw new Error('Stage not found');
  }

  const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  const title = `${contentType} updated`;

  if (!content) {
    content = `${contentType} '${item.name}'`;
  }

  let route = '';

  if (contentType === 'ticket') {
    route = '/inbox';
  }

  if (removedUsers && removedUsers.length > 0) {
    await utils.sendNotification({
      createdUser: user,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_REMOVE_ASSIGN`],
      title,
      action: `removed you from ${contentType}`,
      content: `'${item.name}'`,
      link: `${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&${contentType}Id=${
        item._id
      }`,
      receivers: removedUsers,
    });
  }

  if (invitedUsers && invitedUsers.length > 0) {
    await utils.sendNotification({
      createdUser: user,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_ADD`],
      title,
      action: `invited you to the ${contentType}: `,
      content: `'${item.name}'`,
      link: `${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&${contentType}Id=${
        item._id
      }`,
      receivers: invitedUsers,
    });
  }

  const usersToExclude = [...(removedUsers || []), ...(invitedUsers || []), user._id];

  await utils.sendNotification({
    createdUser: user,
    notifType: type,
    title,
    action: action ? action : `has updated ${contentType}`,
    content,
    link: `${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&${contentType}Id=${
      item._id
    }`,

    // exclude current user, invited user and removed users
    receivers: (await notifiedUserIds(item)).filter(id => {
      return usersToExclude.indexOf(id) < 0;
    }),
  });
};

export const itemsChange = async (collection: any, item: any, type: string, destinationStageId: string) => {
  const oldItem = await collection.findOne({ _id: item._id });
  const oldStageId = oldItem ? oldItem.stageId || '' : '';

  let action = `changed order of your ${type}:`;
  let content = `'${item.name}'`;

  if (oldStageId !== destinationStageId) {
    const stage = await Stages.findOne({ _id: destinationStageId });

    if (!stage) {
      throw new Error('Stage not found');
    }

    action = `moved your`;

    content = `${type} '${item.name}' to the '${stage.name}'.`;
  }

  return { content, action };
};

export const boardId = async (item: any) => {
  const stage = await Stages.findOne({ _id: item.stageId });

  if (!stage) {
    return null;
  }

  const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

  if (!pipeline) {
    return null;
  }

  const board = await Boards.findOne({ _id: pipeline.boardId });

  if (!board) {
    return null;
  }

  return board._id;
};

const PERMISSION_MAP = {
  deal: {
    boardsAdd: 'dealBoardsAdd',
    boardsEdit: 'dealBoardsEdit',
    boardsRemove: 'dealBoardsRemove',
    pipelinesAdd: 'dealPipelinesAdd',
    pipelinesEdit: 'dealPipelinesEdit',
    pipelinesRemove: 'dealPipelinesRemove',
    pipelinesWatch: 'dealPipelinesWatch',
  },
  ticket: {
    boardsAdd: 'ticketBoardsAdd',
    boardsEdit: 'ticketBoardsEdit',
    boardsRemove: 'ticketBoardsRemove',
    pipelinesAdd: 'ticketPipelinesAdd',
    pipelinesEdit: 'ticketPipelinesEdit',
    pipelinesRemove: 'ticketPipelinesRemove',
    pipelinesWatch: 'ticketPipelinesWatch',
  },
  task: {
    boardsAdd: 'taskBoardsAdd',
    boardsEdit: 'taskBoardsEdit',
    boardsRemove: 'taskBoardsRemove',
    pipelinesAdd: 'taskPipelinesAdd',
    pipelinesEdit: 'taskPipelinesEdit',
    pipelinesRemove: 'taskPipelinesRemove',
    pipelinesWatch: 'taskPipelinesWatch',
  },
};

export const checkPermission = async (type: string, user: IUserDocument, mutationName: string) => {
  checkLogin(user);

  const actionName = PERMISSION_MAP[type][mutationName];

  let allowed = await can(actionName, user);

  if (user.isOwner) {
    allowed = true;
  }

  if (!allowed) {
    throw new Error('Permission required');
  }

  return;
};
