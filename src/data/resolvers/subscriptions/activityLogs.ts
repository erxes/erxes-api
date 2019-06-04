import { subscriptionWrapper } from './util';

export default {
  /*
   * Listen for activity log connection
   */
  activityLogsChanged: subscriptionWrapper('activityLogsChanged'),
};
