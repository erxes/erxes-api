import { ActivityLogs, Conformities, Conversations, InternalNotes, Tasks } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

interface IListArgs {
  contentType: string;
  contentId: string;
  activityType: string;
}

const activityLogQueries = {
  /**
   * Get activity log list
   */
  async activityLogs(_root, doc: IListArgs) {
    const { contentType, contentId, activityType } = doc;

    const activities = [] as any;

    const collectActivities = (items: any, type?: string) => {
      if (items) {
        items.map(item => {
          const result = item.toJSON();

          if (type === 'note') {
            result.contentType = type;
          }

          activities.push(result);
        });
      }
    };

    switch (activityType) {
      case 'conversation':
        collectActivities(await Conversations.find({ customerId: contentId }).sort({ createdAt: 1 }));
        break;

      case 'internal_note':
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }).sort({ createdAt: -1 }), 'note');
        break;

      case 'task':
        const relatedTaskIds = await Conformities.savedConformity({
          mainType: contentType,
          mainTypeId: contentId,
          relType: 'task',
        });

        collectActivities(await Tasks.find({ typeId: { $in: relatedTaskIds } }).sort({ closeDate: 1 }));
        break;

      default:
        const relatedItemIds = await Conformities.savedConformity({
          mainType: contentType,
          mainTypeId: contentId,
          relTypes: ['task', 'deal', 'ticket'],
        });

        console.log(relatedItemIds);

        collectActivities(await ActivityLogs.find({ contentId, action: 'moved' }));
        collectActivities(await ActivityLogs.find({ contentId: { $in: relatedItemIds }, action: 'moved' }));
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }).sort({ createdAt: -1 }), 'note');
        collectActivities(await Conversations.find({ customerId: contentId }));

        break;
    }

    return activities;
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
