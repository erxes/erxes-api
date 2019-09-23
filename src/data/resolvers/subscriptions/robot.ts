import { withFilter } from 'apollo-server-express';
import { graphqlPubsub } from '../../../pubsub';

export default {
  onboardingHistoryChanged: {
    subscribe: withFilter(
      () => graphqlPubsub.asyncIterator('onboardingHistoryChanged'),
      (payload, variables) => {
        return payload.onboardingHistory.userId === variables.userId;
      },
    ),
  },
};
