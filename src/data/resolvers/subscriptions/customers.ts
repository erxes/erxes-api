import { subscriptionWrapperWithFilter } from './util';

export default {
  /*
   * Listen for customer connection
   */
  customerConnectionChanged: subscriptionWrapperWithFilter('customerConnectionChanged', ({ _id }, variables) => {
    return _id === variables._id;
  }),
};
