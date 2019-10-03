import { ChecklistItems, Checklists, Deals, Pipelines, Stages, Tasks, Tickets } from '../../../db/models';
import { IChecklist, IChecklistItem, IOrderInput } from '../../../db/models/definitions/checklists';
import { NOTIFICATION_CONTENT_TYPES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { ISendNotification, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { notifiedUserIds } from '../boardUtils';

interface IChecklistsEdit extends IChecklist {
  _id: string;
}

interface IChecklistItemsEdit extends IChecklistItem {
  _id: string;
}

const checklistMutations = {
  /**
   * Adds checklist object and also adds an activity log
   */
  async checklistsAdd(_root, args: IChecklist, { user }: IContext) {
    const checklist = await Checklists.createChecklist(args, user);

    if (checklist) {
      const notifDoc: ISendNotification = {
        title: `${checklist.contentType.toUpperCase()} updated`,
        createdUser: user,
        action: `added checklist in ${args.contentType}`,
        receivers: [],
        content: ``,
        link: ``,
        notifType: ``,
        contentType: ``,
        contentTypeId: ``,
      };

      switch (args.contentType) {
        case 'deal': {
          const deal = await Deals.getDeal(args.contentTypeId);
          const stage = await Stages.getStage(deal.stageId || '');
          const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

          notifDoc.notifType = NOTIFICATION_TYPES.DEAL_EDIT;
          notifDoc.content = `"${deal.name}"`;
          notifDoc.link = `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${deal._id}`;
          notifDoc.contentTypeId = deal._id;
          notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.DEAL;
          notifDoc.receivers = await notifiedUserIds(deal);

          break;
        }

        case 'ticket': {
          const ticket = await Tickets.getTicket(checklist.contentTypeId);
          const stage = await Stages.getStage(ticket.stageId || '');
          const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

          notifDoc.notifType = NOTIFICATION_TYPES.TICKET_EDIT;
          notifDoc.content = `"${ticket.name}"`;
          notifDoc.link = `/inbox/ticket/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${ticket._id}`;
          notifDoc.contentTypeId = ticket._id;
          notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TICKET;
          notifDoc.receivers = await notifiedUserIds(ticket);

          break;
        }

        case 'task': {
          const task = await Tasks.getTask(checklist.contentTypeId);
          const stage = await Stages.getStage(task.stageId || '');
          const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

          notifDoc.notifType = NOTIFICATION_TYPES.TASK_EDIT;
          notifDoc.content = `"${task.name}"`;
          notifDoc.link = `/task/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${task._id}`;
          notifDoc.contentTypeId = task._id;
          notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TASK;
          notifDoc.receivers = await notifiedUserIds(task);

          break;
        }

        default:
          break;
      }

      await utils.sendNotification(notifDoc);

      await putCreateLog(
        {
          type: 'checklist',
          newData: JSON.stringify(args),
          object: checklist,
          description: `${checklist.contentType} has been created`,
        },
        user,
      );
    }

    return checklist;
  },

  /**
   * Updates checklist object
   */
  async checklistsEdit(_root, { _id, ...doc }: IChecklistsEdit, { user }: IContext) {
    const checklist = await Checklists.findOne({ _id });
    const updated = await Checklists.updateChecklist(_id, doc);

    if (checklist) {
      await putUpdateLog(
        {
          type: 'checklist',
          object: checklist,
          newData: JSON.stringify(doc),
          description: `${checklist.contentType} written at ${checklist.createdDate} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove a checklist
   */
  async checklistsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const checklist = await Checklists.getChecklist(_id);
    const removed = await Checklists.removeChecklist(_id);

    await putDeleteLog(
      {
        type: 'checklist',
        object: checklist,
        description: `${checklist.contentType} written at ${checklist.createdDate} has been removed`,
      },
      user,
    );

    return removed;
  },

  /**
   * Adds checklistItems object and also adds an activity log
   */
  async checklistItemsAdd(_root, args: IChecklistItem, { user }: IContext) {
    const checklist = await Checklists.getChecklist(args.checklistId);

    const notifDoc: ISendNotification = {
      title: `${checklist.contentType.toUpperCase()} updated`,
      createdUser: user,
      action: `mentioned you in ${checklist.contentType}'s checklist`,
      receivers: args.mentionedUserIds || [],
      content: ``,
      link: ``,
      notifType: ``,
      contentType: ``,
      contentTypeId: ``,
    };

    switch (checklist.contentType) {
      case 'deal': {
        const deal = await Deals.getDeal(checklist.contentTypeId);
        const stage = await Stages.getStage(deal.stageId || '');
        const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

        notifDoc.notifType = NOTIFICATION_TYPES.DEAL_EDIT;
        notifDoc.content = `"${deal.name}"`;
        notifDoc.link = `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${deal._id}`;
        notifDoc.contentTypeId = deal._id;
        notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.DEAL;
        break;
      }

      case 'ticket': {
        const ticket = await Tickets.getTicket(checklist.contentTypeId);
        const stage = await Stages.getStage(ticket.stageId || '');
        const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

        notifDoc.notifType = NOTIFICATION_TYPES.TICKET_EDIT;
        notifDoc.content = `"${ticket.name}"`;
        notifDoc.link = `/inbox/ticket/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${ticket._id}`;
        notifDoc.contentTypeId = ticket._id;
        notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TICKET;
        break;
      }

      case 'task': {
        const task = await Tasks.getTask(checklist.contentTypeId);
        const stage = await Stages.getStage(task.stageId || '');
        const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

        notifDoc.notifType = NOTIFICATION_TYPES.TASK_EDIT;
        notifDoc.content = `"${task.name}"`;
        notifDoc.link = `/task/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${task._id}`;
        notifDoc.contentTypeId = task._id;
        notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TASK;
        break;
      }

      default:
        break;
    }

    await utils.sendNotification(notifDoc);

    const checklistItem = await ChecklistItems.createChecklistItem(args, user);

    if (checklistItem) {
      await putCreateLog(
        {
          type: 'checklistItem',
          newData: JSON.stringify(args),
          object: checklistItem,
          description: `${checklist.contentType} has been created`,
        },
        user,
      );
    }

    return checklist;
  },

  /**
   * Updates checklistItem object
   */
  async checklistItemsEdit(_root, { _id, ...doc }: IChecklistItemsEdit, { user }: IContext) {
    const checklistItem = await ChecklistItems.getChecklistItem(_id);
    const checklist = await Checklists.getChecklist(checklistItem.checklistId);
    const updated = await ChecklistItems.updateChecklistItem(_id, doc);

    await putUpdateLog(
      {
        type: 'checklistItem',
        object: checklistItem,
        newData: JSON.stringify(doc),
        description: `${checklist.contentType} written at ${checklistItem.createdDate} has been edited /checked/`,
      },
      user,
    );

    return updated;
  },

  /**
   * Update item orders
   */
  updateOrderItems(_root, { orders }: { orders: IOrderInput[] }) {
    return Checklists.updateOrderItems(orders);
  },

  /**
   * Remove a channel
   */
  async checklistItemsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const checklistItem = await ChecklistItems.getChecklistItem(_id);
    const checklist = await Checklists.getChecklist(checklistItem.checklistId);
    const removed = await ChecklistItems.removeChecklistItem(_id);

    await putDeleteLog(
      {
        type: 'checklist',
        object: checklistItem,
        description: `${checklist.contentType} written at ${checklistItem.createdDate} has been removed`,
      },
      user,
    );

    return removed;
  },
};

moduleRequireLogin(checklistMutations);

export default checklistMutations;
