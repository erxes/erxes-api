import { ActivityLogs, Checklists, Conformities, Tickets } from '../../../db/models';
import { IOrderInput } from '../../../db/models/definitions/boards';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { ITicket } from '../../../db/models/definitions/tickets';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { checkUserIds, putCreateLog } from '../../utils';
import {
  copyPipelineLabels,
  createConformity,
  IBoardNotificationParams,
  itemsChange,
  sendNotifications,
} from '../boardUtils';
import { gatherStageNames, gatherUsernamesOfBoardItem, LogDesc } from './logUtils';

interface ITicketsEdit extends ITicket {
  _id: string;
}

const ticketMutations = {
  /**
   * Create new ticket
   */
  async ticketsAdd(_root, doc: ITicket, { user, docModifier }: IContext) {
    doc.watchedUserIds = [user._id];

    const extendedDoc = {
      ...docModifier(doc),
      modifiedBy: user._id,
      userId: user._id,
    };

    const ticket = await Tickets.createTicket(extendedDoc);

    await createConformity({
      mainType: MODULE_NAMES.TICKET,
      mainTypeId: ticket._id,
      customerIds: doc.customerIds,
      companyIds: doc.companyIds,
    });

    await sendNotifications({
      item: ticket,
      user,
      type: NOTIFICATION_TYPES.TICKET_ADD,
      action: `invited you to the`,
      content: `'${ticket.name}'.`,
      contentType: MODULE_NAMES.TICKET,
    });

    let extraDesc: LogDesc[] = await gatherUsernamesOfBoardItem(ticket);

    extraDesc = await gatherStageNames({
      idFields: [doc.stageId],
      foreignKey: 'stageId',
      prevList: extraDesc,
    });

    await putCreateLog(
      {
        type: MODULE_NAMES.TICKET,
        newData: JSON.stringify({
          ...extendedDoc,
          order: ticket.order,
          createdAt: ticket.createdAt,
          modifiedAt: ticket.modifiedAt,
        }),
        object: ticket,
        description: `"${ticket.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return ticket;
  },

  /**
   * Edit ticket
   */
  async ticketsEdit(_root, { _id, ...doc }: ITicketsEdit, { user }: IContext) {
    const oldTicket = await Tickets.getTicket(_id);

    const updatedTicket = await Tickets.updateTicket(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    await copyPipelineLabels({ item: oldTicket, doc, user });

    const notificationDoc: IBoardNotificationParams = {
      item: updatedTicket,
      user,
      type: NOTIFICATION_TYPES.TICKET_EDIT,
      contentType: MODULE_NAMES.TICKET,
    };

    if (doc.assignedUserIds) {
      const { addedUserIds, removedUserIds } = checkUserIds(oldTicket.assignedUserIds, doc.assignedUserIds);

      notificationDoc.invitedUsers = addedUserIds;
      notificationDoc.removedUsers = removedUserIds;
    }

    await sendNotifications(notificationDoc);

    return updatedTicket;
  },

  /**
   * Change ticket
   */
  async ticketsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId: string },
    { user }: IContext,
  ) {
    const ticket = await Tickets.getTicket(_id);

    await Tickets.updateTicket(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
      stageId: destinationStageId,
    });

    const { content, action } = await itemsChange(user._id, ticket, MODULE_NAMES.TICKET, destinationStageId);

    await sendNotifications({
      item: ticket,
      user,
      type: NOTIFICATION_TYPES.TICKET_CHANGE,
      action,
      content,
      contentType: MODULE_NAMES.TICKET,
    });

    return ticket;
  },

  /**
   * Update ticket orders (not sendNotifaction, ordered card to change)
   */
  ticketsUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return Tickets.updateOrder(stageId, orders);
  },

  /**
   * Remove ticket
   */
  async ticketsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const ticket = await Tickets.getTicket(_id);

    await sendNotifications({
      item: ticket,
      user,
      type: NOTIFICATION_TYPES.TICKET_DELETE,
      action: `deleted ticket:`,
      content: `'${ticket.name}'`,
      contentType: MODULE_NAMES.TICKET,
    });

    await Conformities.removeConformity({ mainType: MODULE_NAMES.TICKET, mainTypeId: ticket._id });
    await Checklists.removeChecklists(MODULE_NAMES.TICKET, ticket._id);
    await ActivityLogs.removeActivityLog(ticket._id);

    return ticket.remove();
  },

  /**
   * Watch ticket
   */
  async ticketsWatch(_root, { _id, isAdd }: { _id: string; isAdd: boolean }, { user }: IContext) {
    return Tickets.watchTicket(_id, isAdd, user._id);
  },
};

checkPermission(ticketMutations, 'ticketsAdd', 'ticketsAdd');
checkPermission(ticketMutations, 'ticketsEdit', 'ticketsEdit');
checkPermission(ticketMutations, 'ticketsUpdateOrder', 'ticketsUpdateOrder');
checkPermission(ticketMutations, 'ticketsRemove', 'ticketsRemove');
checkPermission(ticketMutations, 'ticketsWatch', 'ticketsWatch');

export default ticketMutations;
