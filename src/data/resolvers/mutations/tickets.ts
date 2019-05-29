import { Tickets, Pipelines, Stages } from '../../../db/models';
import { IOrderInput } from '../../../db/models/Tickets';
import { ITicket, ITicketDocument } from '../../../db/models/definitions/Tickets';
import { IUserDocument } from '../../../db/models/definitions/users';
import { NOTIFICATION_TYPES } from '../../constants';
import { checkPermission } from '../../permissions';
import utils from '../../utils';

interface ITicketsEdit extends ITicket {
  _id: string;
}

/**
 * Send notification to all members of this ticket except the sender
 */
export const sendTicketNotifications = async (
  ticket: ITicketDocument,
  user: IUserDocument,
  type: string,
  assignedUsers: string[],
  content: string,
) => {
  const stage = await Stages.findOne({ _id: ticket.stageId });

  if (!stage) {
    throw new Error('Stage not found');
  }

  const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  return utils.sendNotification({
    createdUser: user._id,
    notifType: type,
    title: content,
    content,
    link: `/ticket/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,

    // exclude current user
    receivers: (assignedUsers || []).filter(id => id !== user._id),
  });
};

const ticketMutations = {
  /**
   * Create new ticket
   */
  async ticketsAdd(_root, doc: ITicket, { user }: { user: IUserDocument }) {
    const ticket = await Tickets.createTicket({
      ...doc,
      modifiedBy: user._id,
    });

    await sendTicketNotifications(
      ticket,
      user,
      NOTIFICATION_TYPES.TICKET_ADD,
      ticket.assignedUserIds || [],
      `'{userName}' invited you to the '${ticket.name}'.`,
    );

    return ticket;
  },

  /**
   * Edit ticket
   */
  async ticketsEdit(_root, { _id, ...doc }: ITicketsEdit, { user }) {
    const oldTicket = await Tickets.findOne({ _id });
    const oldAssignedUserIds = oldTicket ? oldTicket.assignedUserIds || [] : [];

    const ticket = await Tickets.updateTicket(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
    const assignedUserIds = ticket.assignedUserIds || [];

    // new assignee users
    const newUserIds = assignedUserIds.filter(userId => oldAssignedUserIds.indexOf(userId) < 0);

    if (newUserIds.length > 0) {
      await sendTicketNotifications(
        ticket,
        user,
        NOTIFICATION_TYPES.TICKET_ADD,
        newUserIds,
        `'{userName}' invited you to the ticket: '${ticket.name}'.`,
      );
    }

    // remove from assignee users
    const removedUserIds = oldAssignedUserIds.filter(userId => assignedUserIds.indexOf(userId) < 0);

    if (removedUserIds.length > 0) {
      await sendTicketNotifications(
        ticket,
        user,
        NOTIFICATION_TYPES.TICKET_REMOVE_ASSIGN,
        removedUserIds,
        `'{userName}' removed you from ticket: '${ticket.name}'.`,
      );
    }

    // dont assignee change and other edit
    if (removedUserIds.length === 0 && newUserIds.length === 0) {
      await sendTicketNotifications(
        ticket,
        user,
        NOTIFICATION_TYPES.TICKET_EDIT,
        assignedUserIds,
        `'{userName}' edited your ticket '${ticket.name}'`,
      );
    }

    return ticket;
  },

  /**
   * Change ticket
   */
  async ticketsChange(
    _root,
    { _id, destinationStageId }: { _id: string; destinationStageId?: string },
    { user }: { user: IUserDocument },
  ) {
    const oldTicket = await Tickets.findOne({ _id });
    const oldStageId = oldTicket ? oldTicket.stageId || '' : '';

    const ticket = await Tickets.updateTicket(_id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    let content = `'{userName}' changed order your ticket:'${ticket.name}'`;

    if (oldStageId !== destinationStageId) {
      const stage = await Stages.findOne({ _id: destinationStageId });

      if (!stage) {
        throw new Error('Stage not found');
      }

      content = `'{userName}' moved your ticket '${ticket.name}' to the '${stage.name}'.`;
    }

    await sendTicketNotifications(
      ticket,
      user,
      NOTIFICATION_TYPES.TICKET_CHANGE,
      ticket.assignedUserIds || [],
      content,
    );

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
  async ticketsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const ticket = await Tickets.findOne({ _id });

    if (!ticket) {
      throw new Error('ticket not found');
    }

    await sendTicketNotifications(
      ticket,
      user,
      NOTIFICATION_TYPES.TICKET_DELETE,
      ticket.assignedUserIds || [],
      `'{userName}' deleted ticket: '${ticket.name}'`,
    );

    return Tickets.removeTicket(_id);
  },
};

checkPermission(ticketMutations, 'ticketsAdd', 'ticketsAdd');
checkPermission(ticketMutations, 'ticketsEdit', 'ticketsEdit');
checkPermission(ticketMutations, 'ticketsUpdateOrder', 'ticketsUpdateOrder');
checkPermission(ticketMutations, 'ticketsRemove', 'ticketsRemove');

export default ticketMutations;
