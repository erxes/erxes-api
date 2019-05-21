import { Tickets } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions';

const ticketQueries = {
  /**
   * Tickets list
   */
  async tickets(_root, { stageId }: { stageId: string }) {
    const filter: any = {};

    if (stageId) {
      filter.stageId = stageId;
    }

    return Tickets.find(filter);
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
