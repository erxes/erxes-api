import { Tickets } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';
import { IListParams } from './boards';
import { generateTicketCommonFilters } from './boardUtils';
import companyQueries from './companies';

const ticketQueries = {
  /**
   * Tickets list
   */
  async tickets(_root, args: IListParams) {
    const filter = await generateTicketCommonFilters(args);
    const sort = { order: 1, createdAt: -1 };

    return Tickets.find(filter)
      .sort(sort)
      .skip(args.skip || 0)
      .limit(10);
  },

  async ticketRelatedCompanies(_root, { _id }: { _id: string }) {
    const ticket = await Tickets.findOne({ _id });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return companyQueries.relatedCompanies(ticket.customerIds || [], ticket.companyIds || []);
  },

  async ticketRelatedCustomers(_root, { _id }: { _id: string }) {
    const ticket = await Tickets.findOne({ _id });

    if (!ticket) {
      throw new Error('Ticket not found');
    }
    return companyQueries.relatedCustomers(ticket.customerIds || [], ticket.companyIds || []);
  },

  /**
   * Tickets detail
   */
  ticketDetail(_root, { _id }: { _id: string }) {
    return Tickets.findOne({ _id });
  },
};

moduleRequireLogin(ticketQueries);

checkPermission(ticketQueries, 'tickets', 'showTickets', []);

export default ticketQueries;
