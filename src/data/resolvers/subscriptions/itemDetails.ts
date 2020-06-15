import { withFilter } from 'apollo-server-express';
import { graphqlPubsub } from '../../../pubsub';

export default {
  /*
   * Listen for deal updates
   */
  itemsDetailChanged: {
    subscribe: withFilter(
      () => graphqlPubsub.asyncIterator('itemsDetailChanged'),
      // filter by _id
      (payload, variables) => {
        return payload.itemsDetailChanged._id === variables._id;
      },
    ),
  },
};
