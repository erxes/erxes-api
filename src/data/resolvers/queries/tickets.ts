import { Tickets } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions';
import { IListParams } from './boardTypes';
import { generateCommonFilters } from './utils';

const ticketQueries = {
  /**
   * Tickets list
   */
  async tickets(_root, args: IListParams) {
    const filter = await generateCommonFilters(args);
    const sort = { order: 1, createdAt: -1 };

    return Tickets.find(filter)
      .sort(sort)
      .skip(args.skip || 0)
      .limit(10);
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
