import { withFilter } from 'apollo-server-express';
import { graphqlPubsub } from '../../../pubsub';

export default {
  onboardingChanged: {
    subscribe: withFilter(
      () => graphqlPubsub.asyncIterator('onboardingChanged'),
      (payload, variables) => {
        return payload.onboardingChanged.userId === variables.userId;
      },
    ),
  },
};
