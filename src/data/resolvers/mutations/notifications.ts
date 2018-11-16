import { IContext } from '../../../connectionResolver';
import { IConfig } from '../../../db/models/definitions/notifications';
import { moduleRequireLogin } from '../../permissions';
import { pubsub } from '../subscriptions';

const notificationMutations = {
  /**
   * Save notification configuration
   */
  notificationsSaveConfig(_root, doc: IConfig, { user, models: { NotificationConfigurations } }: IContext) {
    return NotificationConfigurations.createOrUpdateConfiguration(doc, user);
  },

  /**
   * Marks notification as read
   */
  notificationsMarkAsRead(_root, { _ids }: { _ids: string[] }, { user, models: { Notifications } }: IContext) {
    // notify subscription
    pubsub.publish('notificationsChanged', '');

    return Notifications.markAsRead(_ids, user._id);
  },
};

moduleRequireLogin(notificationMutations);

export default notificationMutations;
