import { Boards, Companies, Customers, Pipelines, Stages, Users } from '../../db/models';
import { ITicketDocument } from '../../db/models/definitions/tickets';

export default {
  companies(ticket: ITicketDocument) {
    return Companies.find({ _id: { $in: ticket.companyIds || [] } });
  },

  customers(ticket: ITicketDocument) {
    return Customers.find({ _id: { $in: ticket.customerIds || [] } });
  },

  assignedUsers(ticket: ITicketDocument) {
    return Users.find({ _id: { $in: ticket.assignedUserIds } });
  },

  async pipeline(ticket: ITicketDocument) {
    const stage = await Stages.findOne({ _id: ticket.stageId });

    if (!stage) {
      return null;
    }

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  async boardId(ticket: ITicketDocument) {
    const stage = await Stages.findOne({ _id: ticket.stageId });

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
  },

  async stage(ticket: ITicketDocument) {
    return Stages.findOne({ _id: ticket.stageId });
  },
};
