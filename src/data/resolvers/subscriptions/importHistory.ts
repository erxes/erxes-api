import { withFilter } from 'apollo-server-express';
import pubsub from './pubsub';

export default {
  /*
   * Listen for import history updates
   */
  importHistoryChanged: {
    subscribe: withFilter(
      () => pubsub.asyncIterator('importHistoryChanged'),
      // filter by importHistoryId
      (payload, variables) => {
        return payload.importHistoryChanged._id === variables._id;
      },
    ),
  },
};
