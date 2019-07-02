import { Boards, Pipelines, Stages } from '../../db/models';
import { NOTIFICATION_TYPES } from '../../db/models/definitions/constants';
import { IDealDocument } from '../../db/models/definitions/deals';
import { ITicketDocument } from '../../db/models/definitions/tickets';
import { IUserDocument } from '../../db/models/definitions/users';
import { can } from '../permissions/utils';
import { checkLogin } from '../permissions/wrappers';
import utils, { getEnv } from '../utils';

/**
 * Send notification to all members of this content except the sender
 */
export const sendNotifications = async ({
  item,
  user,
  type,
  content,
  contentType,
  invitedUsers,
  removedUsers,
}: {
  item: IDealDocument;
  user: IUserDocument;
  type: string;
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

  const title = `has updated your ${contentType} '${item.name}'`;

  if (!content) {
    content = title;
  }

  const MAIN_APP_DOMAIN = getEnv({ name: 'MAIN_APP_DOMAIN' });

  let route = '';

  if (contentType === 'ticket') {
    route = '/inbox';
  }

  if (removedUsers && removedUsers.length > 0) {
    content = `removed you from ${contentType}: '${item.name}'.`;

    await utils.sendNotification({
      createdUser: user,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_REMOVE_ASSIGN`],
      title,
      content,
      link: `${MAIN_APP_DOMAIN}${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
      receivers: removedUsers,
    });
  }

  if (invitedUsers && invitedUsers.length > 0) {
    content = `invited you to the ${contentType}: '${item.name}'.`;

    await utils.sendNotification({
      createdUser: user,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_ADD`],
      title,
      content,
      link: `${MAIN_APP_DOMAIN}${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
      receivers: invitedUsers,
    });
  }

  const usersToExclude = [...(removedUsers || []), ...(invitedUsers || []), user._id];

  await utils.sendNotification({
    createdUser: user,
    notifType: type,
    title,
    content,
    link: `${MAIN_APP_DOMAIN}${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,

    // exclude current user, invited user and removed users
    receivers: (item.assignedUserIds || []).filter(id => {
      return usersToExclude.indexOf(id) < 0;
    }),
  });
};

export const itemsChange = async (
  collection: any,
  item: IDealDocument | ITicketDocument,
  type: string,
  destinationStageId: string,
) => {
  const oldItem = await collection.findOne({ _id: item._id });
  const oldStageId = oldItem ? oldItem.stageId || '' : '';

  let content = `changed order your ${type}:'${item.name}'`;

  if (oldStageId !== destinationStageId) {
    const stage = await Stages.findOne({ _id: destinationStageId });

    if (!stage) {
      throw new Error('Stage not found');
    }

    content = `moved your ${type} '${item.name}' to the '${stage.name}'.`;
  }

  return content;
};

export const boardId = async (item: IDealDocument | ITicketDocument) => {
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
  },
  ticket: {
    boardsAdd: 'ticketBoardsAdd',
    boardsEdit: 'ticketBoardsEdit',
    boardsRemove: 'ticketBoardsRemove',
    pipelinesAdd: 'ticketPipelinesAdd',
    pipelinesEdit: 'ticketPipelinesEdit',
    pipelinesRemove: 'ticketPipelinesRemove',
  },
  task: {
    boardsAdd: 'taskBoardsAdd',
    boardsEdit: 'taskBoardsEdit',
    boardsRemove: 'taskBoardsRemove',
    pipelinesAdd: 'taskPipelinesAdd',
    pipelinesEdit: 'taskPipelinesEdit',
    pipelinesRemove: 'taskPipelinesRemove',
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
