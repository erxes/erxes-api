import { ActivityLogs, Conformities, Conversations, EngageMessages, InternalNotes, Tasks } from '../../../db/models';
import { IActivityLogDocument } from '../../../db/models/definitions/activityLogs';
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

    const activities: any[] = [];

    const relatedItemIds = await Conformities.savedConformity({
      mainType: contentType,
      mainTypeId: contentId,
      relTypes: contentType !== 'task' ? ['deal', 'ticket'] : ['deal', 'ticket', 'task'],
    });

    const relatedTaskIds = await Conformities.savedConformity({
      mainType: contentType,
      mainTypeId: contentId,
      relTypes: ['task'],
    });

    const collectItems = (items: any, type?: string) => {
      if (items) {
        items.map(item => {
          let result: IActivityLogDocument = {} as any;

          item = item.toJSON();

          if (!type) {
            result = item;
          }

          if (type && type !== 'taskDetail') {
            result._id = item._id;
            result.contentType = type;
            result.contentId = contentId;
            result.createdAt = item.createdAt;
          }

          if (type === 'taskDetail') {
            result._id = item._id;
            result.contentType = type;
            result.createdAt = item.closeDate || item.createdAt;
          }

          activities.push(result);
        });
      }
    };

    const collectConversations = async () => {
      collectItems(await Conversations.find({ customerId: contentId }).sort({ createdAt: 1 }), 'conversation');
      if (contentType === 'customer') {
        let conversationIds;

        try {
          conversationIds = await dataSources.IntegrationsAPI.fetchApi('/facebook/get-customer-posts', {
            customerId: contentId,
          });
          collectItems(await Conversations.find({ _id: { $in: conversationIds } }), 'comment');
        } catch (e) {
          debugExternalApi(e);
        }
      }
    };

    const collectActivityLogs = async () => {
      collectItems(await ActivityLogs.find({ contentId: { $in: [...relatedItemIds, contentId] } }));
    };

    const collectInternalNotes = async () => {
      collectItems(await InternalNotes.find({ contentTypeId: contentId }).sort({ createdAt: -1 }), 'note');
    };

    const collectEngageMessages = async () => {
      collectItems(await EngageMessages.find({ customerIds: contentId, method: 'email' }), 'email');
    };

    const collectTasks = async () => {
      if (contentType !== 'task') {
        collectItems(await Tasks.find({ _id: { $in: relatedTaskIds } }).sort({ closeDate: 1 }), 'taskDetail');
      }
    };

    switch (activityType) {
      case 'conversation':
        collectConversations();
        break;

      case 'internal_note':
        await collectInternalNotes();
        break;

      case 'task':
        await collectTasks();
        break;

      case 'email':
        await collectEngageMessages();
        break;

      default:
        await collectConversations();
        await collectActivityLogs();
        await collectInternalNotes();
        await collectEngageMessages();

        activities.sort((a, b) => {
          return b.createdAt - a.createdAt;
        });

        break;
    }

    return activities;
  },
};

moduleRequireLogin(activityLogQueries);

export default activityLogQueries;
