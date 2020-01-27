import {
  Companies,
  Customers,
  Deals,
  GrowthHacks,
  InternalNotes,
  Pipelines,
  Products,
  Stages,
  Tasks,
  Tickets,
  Users,
} from '../../../db/models';
import { NOTIFICATION_CONTENT_TYPES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IDealDocument } from '../../../db/models/definitions/deals';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { ITaskDocument } from '../../../db/models/definitions/tasks';
import { ITicketDocument } from '../../../db/models/definitions/tickets';
import { MODULE_NAMES } from '../../constants';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { ISendNotification, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { notifiedUserIds } from '../boardUtils';
import { gatherUsernames, LogDesc } from './logUtils';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const sendNotificationOfItems = async (
  item: IDealDocument | ITicketDocument | ITaskDocument,
  doc: ISendNotification,
  contentType: string,
  excludeUserIds: string[],
) => {
  const notifDocItems = { ...doc };
  const relatedReceivers = await notifiedUserIds(item);
  notifDocItems.action = `added note in ${contentType}`;

  notifDocItems.receivers = relatedReceivers.filter(id => {
    return excludeUserIds.indexOf(id) < 0;
  });

  utils.sendNotification(notifDocItems);
};

const findContentItemName = async (contentType: string, contentTypeId: string): Promise<string> => {
  let name: string = '';

  if (contentType === MODULE_NAMES.DEAL) {
    const deal = await Deals.getDeal(contentTypeId);

    if (deal && deal.name) {
      name = deal.name;
    }
  }

  if (contentType === MODULE_NAMES.CUSTOMER) {
    const customer = await Customers.getCustomer(contentTypeId);

    if (customer) {
      name = Customers.getCustomerName(customer);
    }
  }

  if (contentType === MODULE_NAMES.COMPANY) {
    const company = await Companies.getCompany(contentTypeId);

    if (company) {
      name = Companies.getCompanyName(company);
    }
  }

  if (contentType === MODULE_NAMES.TASK) {
    const task = await Tasks.getTask(contentTypeId);

    if (task && task.name) {
      name = task.name;
    }
  }

  if (contentType === MODULE_NAMES.TICKET) {
    const ticket = await Tickets.getTicket(contentTypeId);

    if (ticket && ticket.name) {
      name = ticket.name;
    }
  }

  if (contentType === MODULE_NAMES.GROWTH_HACK) {
    const gh = await GrowthHacks.getGrowthHack(contentTypeId);

    if (gh && gh.name) {
      name = gh.name;
    }
  }

  if (contentType === MODULE_NAMES.USER) {
    const user = await Users.getUser(contentTypeId);

    if (user) {
      name = user.username || user.email || '';
    }
  }

  if (contentType === MODULE_NAMES.PRODUCT) {
    const product = await Products.getProduct({ _id: contentTypeId });

    if (product) {
      name = product.name;
    }
  }

  return name;
};

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user }: IContext) {
    const { contentType, contentTypeId } = args;
    const mentionedUserIds = args.mentionedUserIds || [];

    const notifDoc: ISendNotification = {
      title: `${contentType.toUpperCase()} updated`,
      createdUser: user,
      action: `mentioned you in ${contentType}`,
      receivers: mentionedUserIds,
      content: '',
      link: '',
      notifType: '',
      contentType: '',
      contentTypeId: '',
    };

    const extraDesc: LogDesc[] = [{ createdUserId: user._id, name: user.username || user.email }];

    if (contentType === MODULE_NAMES.DEAL) {
      const deal = await Deals.getDeal(contentTypeId);
      const stage = await Stages.getStage(deal.stageId);
      const pipeline = await Pipelines.getPipeline(stage.pipelineId);

      notifDoc.notifType = NOTIFICATION_TYPES.DEAL_EDIT;
      notifDoc.content = `"${deal.name}"`;
      notifDoc.link = `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${deal._id}`;
      notifDoc.contentTypeId = deal._id;
      notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.DEAL;

      extraDesc.push({ contentTypeId, name: deal.name });

      await sendNotificationOfItems(deal, notifDoc, contentType, [...mentionedUserIds, user._id]);
    }

    if (contentType === MODULE_NAMES.CUSTOMER) {
      const customer = await Customers.getCustomer(contentTypeId);

      notifDoc.notifType = NOTIFICATION_TYPES.CUSTOMER_MENTION;
      notifDoc.content = Customers.getCustomerName(customer);
      notifDoc.link = `/contacts/customers/details/${customer._id}`;
      notifDoc.contentTypeId = customer._id;
      notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.CUSTOMER;

      extraDesc.push({ contentTypeId, name: Customers.getCustomerName(customer) });
    }

    if (contentType === MODULE_NAMES.COMPANY) {
      const company = await Companies.getCompany(contentTypeId);

      notifDoc.notifType = NOTIFICATION_TYPES.CUSTOMER_MENTION;
      notifDoc.content = Companies.getCompanyName(company);
      notifDoc.link = `/contacts/companies/details/${company._id}`;
      notifDoc.contentTypeId = company._id;
      notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.COMPANY;

      extraDesc.push({ contentTypeId, name: Companies.getCompanyName(company) });
    }

    if (contentType === MODULE_NAMES.TICKET) {
      const ticket = await Tickets.getTicket(contentTypeId);
      const stage = await Stages.getStage(ticket.stageId);
      const pipeline = await Pipelines.getPipeline(stage.pipelineId);

      notifDoc.notifType = NOTIFICATION_TYPES.TICKET_EDIT;
      notifDoc.content = `"${ticket.name}"`;
      notifDoc.link = `/inbox/ticket/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${ticket._id}`;
      notifDoc.contentTypeId = ticket._id;
      notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TICKET;

      extraDesc.push({ contentTypeId, name: ticket.name });

      await sendNotificationOfItems(ticket, notifDoc, contentType, [...mentionedUserIds, user._id]);
    }

    if (contentType === MODULE_NAMES.TASK) {
      const task = await Tasks.getTask(contentTypeId);
      const stage = await Stages.getStage(task.stageId);
      const pipeline = await Pipelines.getPipeline(stage.pipelineId);

      notifDoc.notifType = NOTIFICATION_TYPES.TASK_EDIT;
      notifDoc.content = `"${task.name}"`;
      notifDoc.link = `/task/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${task._id}`;
      notifDoc.contentTypeId = task._id;
      notifDoc.contentType = NOTIFICATION_CONTENT_TYPES.TASK;

      extraDesc.push({ contentTypeId, name: task.name });

      await sendNotificationOfItems(task, notifDoc, contentType, [...mentionedUserIds, user._id]);
    }

    if (contentType === MODULE_NAMES.GROWTH_HACK) {
      const hack = await GrowthHacks.getGrowthHack(contentTypeId);

      notifDoc.content = `${hack.name}`;

      extraDesc.push({ contentTypeId, name: hack.name });
    }

    if (contentType === MODULE_NAMES.USER) {
      const usr = await Users.getUser(contentTypeId);

      notifDoc.content = `${usr.username || usr.email}`;

      extraDesc.push({ contentTypeId, name: notifDoc.content });
    }

    if (contentType === MODULE_NAMES.PRODUCT) {
      const product = await Products.getProduct({ _id: contentTypeId });

      notifDoc.content = product.name;

      extraDesc.push({ contentTypeId, name: product.name });
    }

    if (notifDoc.contentType) {
      await utils.sendNotification(notifDoc);
    }

    const internalNote = await InternalNotes.createInternalNote(args, user);

    if (internalNote) {
      await putCreateLog(
        {
          type: MODULE_NAMES.INTERNAL_NOTE,
          newData: { ...args, createdUserId: user._id, createdAt: internalNote.createdAt },
          object: internalNote,
          description: `A note for ${internalNote.contentType} "${notifDoc.content}" has been created`,
          extraDesc,
        },
        user,
      );
    }

    return internalNote;
  },

  /**
   * Updates internalNote object
   */
  async internalNotesEdit(_root, { _id, ...doc }: IInternalNotesEdit, { user }: IContext) {
    const internalNote = await InternalNotes.getInternalNote(_id);
    const updated = await InternalNotes.updateInternalNote(_id, doc);

    let extraDesc: LogDesc[] = [
      {
        contentTypeId: internalNote.contentTypeId,
        name: await findContentItemName(internalNote.contentType, internalNote.contentTypeId),
      },
    ];

    extraDesc = await gatherUsernames({
      idFields: [internalNote.createdUserId],
      foreignKey: 'createdUserId',
      prevList: extraDesc,
    });

    await putUpdateLog(
      {
        type: MODULE_NAMES.INTERNAL_NOTE,
        object: internalNote,
        newData: doc,
        description: `Note of type ${internalNote.contentType} has been edited`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes an internal note
   */
  async internalNotesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const internalNote = await InternalNotes.getInternalNote(_id);
    const removed = await InternalNotes.removeInternalNote(_id);

    let extraDesc: LogDesc[] = [
      {
        contentTypeId: internalNote.contentTypeId,
        name: await findContentItemName(internalNote.contentType, internalNote.contentTypeId),
      },
    ];

    extraDesc = await gatherUsernames({
      idFields: [internalNote.createdUserId],
      foreignKey: 'createdUserId',
      prevList: extraDesc,
    });

    await putDeleteLog(
      {
        type: MODULE_NAMES.INTERNAL_NOTE,
        object: internalNote,
        description: `Note of type ${internalNote.contentType} has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

moduleRequireLogin(internalNoteMutations);

export default internalNoteMutations;
