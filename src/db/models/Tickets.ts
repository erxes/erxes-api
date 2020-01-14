import { Model, model } from 'mongoose';
import { ActivityLogs, Companies, Conformities, Customers } from '.';
import { fillSearchTextItem, updateOrder, watchItem } from './boardUtils';
import { IOrderInput } from './definitions/boards';
import { ICompanyDocument } from './definitions/companies';
import { ICustomerDocument } from './definitions/customers';
import { ITicket, ITicketDocument, ticketSchema } from './definitions/tickets';

export interface ITicketModel extends Model<ITicketDocument> {
  createTicket(doc: ITicket): Promise<ITicketDocument>;
  getTicket(_id: string): Promise<ITicketDocument>;
  updateTicket(_id: string, doc: ITicket): Promise<ITicketDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<ITicketDocument[]>;
  watchTicket(_id: string, isAdd: boolean, userId: string): void;
  getCustomers(_id: string): Promise<ICustomerDocument[]>;
  getCompanies(_id: string): Promise<ICompanyDocument[]>;
}

export const loadTicketClass = () => {
  class Ticket {
    /**
     * Retreives Ticket
     */
    public static async getTicket(_id: string) {
      const ticket = await Tickets.findOne({ _id });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      return ticket;
    }

    /**
     * Create a Ticket
     */
    public static async createTicket(doc: ITicket) {
      if (doc.sourceConversationId) {
        const convertedTicket = await Tickets.findOne({ sourceConversationId: doc.sourceConversationId });

        if (convertedTicket) {
          throw new Error('Already converted a ticket');
        }
      }

      const ticketsCount = await Tickets.find({
        stageId: doc.stageId,
      }).countDocuments();

      const ticket = await Tickets.create({
        ...doc,
        order: ticketsCount,
        createdAt: new Date(),
        modifiedAt: new Date(),
        searchText: fillSearchTextItem(doc),
      });

      // create log
      await ActivityLogs.createBoardItemLog({ item: ticket, contentType: 'ticket' });

      return ticket;
    }

    /**
     * Update Ticket
     */
    public static async updateTicket(_id: string, doc: ITicket) {
      const searchText = fillSearchTextItem(doc, await Tickets.getTicket(_id));

      await Tickets.updateOne({ _id }, { $set: doc, searchText });

      return Tickets.findOne({ _id });
    }

    /*
     * Update given tickets orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      return updateOrder(Tickets, orders, stageId);
    }

    /**
     * Watch ticket
     */
    public static async watchTicket(_id: string, isAdd: boolean, userId: string) {
      return watchItem(Tickets, _id, isAdd, userId);
    }

    public static async getCompanies(_id: string) {
      const conformities = await Conformities.find({ mainType: 'ticket', mainTypeId: _id, relType: 'company' });

      const companyIds = conformities.map(c => c.relTypeId);

      return Companies.find({ _id: { $in: companyIds } });
    }

    public static async getCustomers(_id: string) {
      const conformities = await Conformities.find({ mainType: 'ticket', mainTypeId: _id, relType: 'customer' });

      const customerIds = conformities.map(c => c.relTypeId);

      return Customers.find({ _id: { $in: customerIds } });
    }
  }

  ticketSchema.loadClass(Ticket);

  return ticketSchema;
};

loadTicketClass();

// tslint:disable-next-line
const Tickets = model<ITicketDocument, ITicketModel>('tickets', ticketSchema);

export default Tickets;
