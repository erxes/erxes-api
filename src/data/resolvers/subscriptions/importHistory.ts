import { withFilter } from 'apollo-server-express';
import { graphqlPubsub } from '../../../pubsub';

export default {
  /*
   * Listen for import history updates
   */
  importHistoryChanged: {
    subscribe: withFilter(
      () => (graphqlPubsub as any).asyncIterator('importHistoryChanged'),
      // filter by importHistoryId
      (payload, variables) => {
        return payload.importHistoryChanged._id === variables._id;
      },
    ),
  },
};
