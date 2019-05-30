import { Model, model } from 'mongoose';
import { ActivityLogs } from '.';
import { ITicket, ITicketDocument, ticketSchema } from './definitions/tickets';

export interface IOrderInput {
  _id: string;
  order: number;
}

export interface ITicketModel extends Model<ITicketDocument> {
  createTicket(doc: ITicket): Promise<ITicketDocument>;
  updateTicket(_id: string, doc: ITicket): Promise<ITicketDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<ITicketDocument[]>;
  removeTicket(_id: string): void;
}

export const loadTicketClass = () => {
  class Ticket {
    /**
     * Create a Ticket
     */
    public static async createTicket(doc: ITicket) {
      const ticketsCount = await Tickets.find({
        stageId: doc.stageId,
      }).countDocuments();

      const ticket = await Tickets.create({
        ...doc,
        order: ticketsCount,
        modifiedAt: new Date(),
      });

      // create log
      await ActivityLogs.createTicketLog(ticket);

      return ticket;
    }

    /**
     * Update Ticket
     */
    public static async updateTicket(_id: string, doc: ITicket) {
      await Tickets.updateOne({ _id }, { $set: doc });

      return Tickets.findOne({ _id });
    }

    /*
     * Update given tickets orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      const ids: string[] = [];
      const bulkOps: Array<{
        updateOne: {
          filter: { _id: string };
          update: { stageId: string; order: number };
        };
      }> = [];

      for (const { _id, order } of orders) {
        ids.push(_id);
        bulkOps.push({
          updateOne: {
            filter: { _id },
            update: { stageId, order },
          },
        });

        // update each tickets order
      }

      if (bulkOps) {
        await Tickets.bulkWrite(bulkOps);
      }

      return Tickets.find({ _id: { $in: ids } }).sort({ order: 1 });
    }

    /**
     * Remove Ticket
     */
    public static async removeTicket(_id: string) {
      const ticket = await Tickets.findOne({ _id });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      return ticket.remove();
    }
  }

  ticketSchema.loadClass(Ticket);

  return ticketSchema;
};

loadTicketClass();

// tslint:disable-next-line
const Tickets = model<ITicketDocument, ITicketModel>('tickets', ticketSchema);

export default Tickets;
