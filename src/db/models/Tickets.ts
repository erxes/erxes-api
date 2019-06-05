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
  changeCustomer(newCustomerId: string, oldCustomerIds: string[]): Promise<ITicketDocument>;
  changeCompany(newCompanyId: string, oldCompanyIds: string[]): Promise<ITicketDocument>;
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

    /**
     * Change customer
     */
    public static async changeCustomer(newCustomerId: string, oldCustomerIds: string[]) {
      if (oldCustomerIds) {
        await Tickets.updateMany(
          { customerIds: { $in: oldCustomerIds } },
          { $addToSet: { customerIds: newCustomerId } },
        );
        await Tickets.updateMany(
          { customerIds: { $in: oldCustomerIds } },
          { $pullAll: { customerIds: oldCustomerIds } },
        );
      }

      return Tickets.find({ customerIds: { $in: oldCustomerIds } });
    }

    /**
     * Change company
     */
    public static async changeCompany(newCompanyId: string, oldCompanyIds: string[]) {
      if (oldCompanyIds) {
        await Tickets.updateMany({ companyIds: { $in: oldCompanyIds } }, { $addToSet: { companyIds: newCompanyId } });

        await Tickets.updateMany({ companyIds: { $in: oldCompanyIds } }, { $pullAll: { companyIds: oldCompanyIds } });
      }

      return Tickets.find({ customerIds: { $in: oldCompanyIds } });
    }
  }

  ticketSchema.loadClass(Ticket);

  return ticketSchema;
};

loadTicketClass();

// tslint:disable-next-line
const Tickets = model<ITicketDocument, ITicketModel>('tickets', ticketSchema);

export default Tickets;
