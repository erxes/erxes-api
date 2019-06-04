import { subscriptionWrapperWithFilter } from './util';

export default {
  /*
   * Listen for import history updates
   */
  importHistoryChanged: subscriptionWrapperWithFilter('importHistoryChanged', ({ _id }, variables) => {
    return _id === variables._id;
  }),
};
