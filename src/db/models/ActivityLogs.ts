import { Model, model } from 'mongoose';
import { graphqlPubsub } from '../../pubsub';
import { activityLogSchema, IActivityLogDocument, IActivityLogInput } from './definitions/activityLogs';

import { IItemCommonFieldsDocument } from './definitions/boards';
import { ACTIVITY_ACTIONS } from './definitions/constants';

export interface IActivityLogModel extends Model<IActivityLogDocument> {
  addActivityLog(doc: IActivityLogInput): Promise<IActivityLogDocument>;
  createLogFromWidget(type: string, payload): Promise<IActivityLogDocument>;
  createCocLog({ coc, contentType }: { coc: any; contentType: string }): Promise<IActivityLogDocument>;
  createBoardItemLog({
    item,
    contentType,
  }: {
    item: IItemCommonFieldsDocument;
    contentType: string;
  }): Promise<IActivityLogDocument>;
  createBoardItemMovementLog(
    item: IItemCommonFieldsDocument,
    type: string,
    userId: string,
    content: object,
  ): Promise<IActivityLogDocument>;
}

export const loadClass = () => {
  class ActivityLog {
    public static async addActivityLog(doc: IActivityLogInput) {
      const activity = await ActivityLogs.create(doc);

      graphqlPubsub.publish('activityLogsChanged', { activityLogsChanged: true });

      return activity;
    }

    public static createBoardItemLog({ item, contentType }: { item: IItemCommonFieldsDocument; contentType: string }) {
      return ActivityLogs.addActivityLog({
        contentType,
        contentId: item._id,
        action: ACTIVITY_ACTIONS.CREATE,
        createdBy: item.userId || '',
      });
    }

    public static createBoardItemMovementLog(
      item: IItemCommonFieldsDocument,
      contentType: string,
      userId: string,
      content: object,
    ) {
      return ActivityLogs.addActivityLog({
        contentType,
        contentId: item._id,
        action: ACTIVITY_ACTIONS.MOVED,
        createdBy: userId,
        content,
      });
    }

    public static createLogFromWidget(type: string, payload) {
      switch (type) {
        case 'create-customer':
          ActivityLogs.createCocLog({ coc: payload, contentType: 'customer' });
          break;
        case 'create-company':
          ActivityLogs.createCocLog({ coc: payload, contentType: 'company' });
          break;
      }
    }

    public static createCocLog({ coc, contentType }: { coc: any; contentType: string }) {
      let action = ACTIVITY_ACTIONS.CREATE;
      let content = '';

      if (coc.mergedIds && coc.mergedIds.length > 0) {
        action = ACTIVITY_ACTIONS.MERGE;
        content = coc.mergedIds;
      }

      return ActivityLogs.addActivityLog({
        contentType,
        content,
        contentId: coc._id,
        action,
        createdBy: coc.ownerId || coc.integrationId,
      });
    }
  }

  activityLogSchema.loadClass(ActivityLog);

  return activityLogSchema;
};

loadClass();

// tslint:disable-next-line
const ActivityLogs = model<IActivityLogDocument, IActivityLogModel>('activity_logs', activityLogSchema);

export default ActivityLogs;
