import { ActivityLogs, Conformities, Conversations, InternalNotes } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const activityLogQueries = {
  /**
   * Get activity log list
   */
  async activityLogs(_root, doc: any) {
    const { contentType, contentId, activityType } = doc;

    const activities = [] as any;

    const collectActivities = (items: any, type?: string) => {
      if (items) {
        items.map(item => {
          const result = item.toJSON();

          if (type) {
            result.type = type;
          }

          activities.push(result);
        });
      }
    };

    switch (activityType) {
      case 'conversation':
        collectActivities(await Conversations.find({ customerId: contentId }));
        break;

      case 'internal_note':
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }), 'note');
        break;

      case 'task':
        const relatedTaskIds = await Conformities.savedConformity({
          mainType: contentType,
          mainTypeId: contentId,
          relType: 'task',
        });

        collectActivities(await ActivityLogs.find({ typeId: { $in: relatedTaskIds } }));
        break;

      default:
        const relatedItemIds = await Conformities.savedConformity({
          mainType: contentType,
          mainTypeId: contentId,
          relTypes: ['task', 'deal', 'ticket'],
        });

        collectActivities(await ActivityLogs.find({ typeId: contentId, action: 'CREATE' }));
        collectActivities(await ActivityLogs.find({ typeId: { $in: relatedItemIds } }));
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }), 'note');

        break;
    }

    return activities;
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
