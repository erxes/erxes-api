import { ActivityLogs, Conformities, Conversations, EngageMessages, InternalNotes, Tasks } from '../../../db/models';
import { debugExternalApi } from '../../../debuggers';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IListArgs {
  contentType: string;
  contentId: string;
  activityType: string;
}

const activityLogQueries = {
  /**
   * Get activity log list
   */
  async activityLogs(_root, doc: IListArgs, { dataSources }: IContext) {
    const { contentType, contentId, activityType } = doc;

    const activities = [] as any;

    const collectActivities = (items: any, type?: string) => {
      if (items) {
        items.map(item => {
          const result = item.toJSON();

          if (type && type !== 'taskDetail') {
            result.contentType = type;
            result.contentId = contentId;
          }

          if (type === 'taskDetail') {
            result.contentType = type;
            result.createdAt = item.closeDate;
          }

          activities.push(result);
        });
      }
    };

    const relatedItemIds = await Conformities.savedConformity({
      mainType: contentType,
      mainTypeId: contentId,
      relTypes: contentType !== 'task' ? ['deal', 'ticket'] : ['deal', 'ticket', 'task'],
    });

    const relatedTaskIds = await Conformities.savedConformity({
      mainType: contentType,
      mainTypeId: contentId,
      relType: 'task',
    });

    switch (activityType) {
      case 'conversation':
        collectActivities(await Conversations.find({ customerId: contentId }).sort({ createdAt: 1 }), 'conversation');
        break;

      case 'internal_note':
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }).sort({ createdAt: -1 }), 'note');
        break;

      case 'task':
        collectActivities(await Tasks.find({ _id: { $in: relatedTaskIds } }).sort({ closeDate: 1 }), 'taskDetail');
        break;

      case 'email':
        collectActivities(await EngageMessages.find({ customerIds: contentId, method: 'email' }), 'email');
        break;

      default:
        if (contentType !== 'task') {
          collectActivities(await Tasks.find({ _id: { $in: relatedTaskIds } }).sort({ closeDate: 1 }), 'taskDetail');
        }

        collectActivities(await ActivityLogs.find({ contentId }));
        collectActivities(await ActivityLogs.find({ contentId: { $in: relatedItemIds } }));
        collectActivities(await InternalNotes.find({ contentTypeId: contentId }).sort({ createdAt: -1 }), 'note');
        collectActivities(await Conversations.find({ customerId: contentId }), 'conversation');
        collectActivities(await EngageMessages.find({ customerIds: contentId, method: 'email' }), 'email');

        if (contentType === 'customer') {
          let conversationIds;

          try {
            conversationIds = await dataSources.IntegrationsAPI.fetchApi('/facebook/get-customer-posts', {
              customerId: contentId,
            });
            collectActivities(await Conversations.find({ _id: { $in: conversationIds } }), 'comment');
          } catch (e) {
            debugExternalApi(e);
          }
        }

        break;
    }

    activities.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    console.log(activities);

    return activities;
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
