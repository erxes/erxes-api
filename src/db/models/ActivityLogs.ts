import { Model, model } from 'mongoose';
import { graphqlPubsub } from '../../pubsub';
import { activityLogSchema, IActivityLogDocument, IActivityLogInput } from './definitions/activityLogs';
import { IChecklistDocument } from './definitions/checklists';

import { IItemCommonFieldsDocument } from './definitions/boards';
import { ACTIVITY_ACTIONS } from './definitions/constants';
import { IConversationDocument } from './definitions/conversations';
import { IEmailDeliveriesDocument } from './definitions/emailDeliveries';
import { IInternalNoteDocument } from './definitions/internalNotes';

export interface IActivityLogModel extends Model<IActivityLogDocument> {
  addActivityLog(doc: IActivityLogInput): Promise<IActivityLogDocument>;
  createLogFromWidget(type: string, payload): Promise<IActivityLogDocument>;
  createConversationLog(conversation: IConversationDocument): Promise<IActivityLogDocument>;
  createEmailDeliveryLog(email: IEmailDeliveriesDocument): Promise<IActivityLogDocument>;
  createInternalNoteLog(internalNote: IInternalNoteDocument): Promise<IActivityLogDocument>;
  createChecklistLog(checklist: IChecklistDocument): Promise<IActivityLogDocument>;
  createCocLog({ coc, type }: { coc: any; type: string }): Promise<IActivityLogDocument>;
  createBoardItemLog({ item, type }: { item: IItemCommonFieldsDocument; type: string }): Promise<IActivityLogDocument>;
}

export const loadClass = () => {
  class ActivityLog {
    public static async addActivityLog(doc: IActivityLogInput) {
      const activity = await ActivityLogs.create(doc);

      graphqlPubsub.publish('activityLogsChanged', { activityLogsChanged: true });

      return activity;
    }

    public static createBoardItemLog({ item, type }: { item: IItemCommonFieldsDocument; type: string }) {
      return ActivityLogs.addActivityLog({
        type,
        typeId: item._id,
        action: ACTIVITY_ACTIONS.CREATE,
        createdBy: item.userId || '',
      });
    }

    public static createLogFromWidget(type: string, payload) {
      switch (type) {
        case 'create-customer':
          ActivityLogs.createCocLog({ coc: payload, type: 'customer' });
          break;
        case 'create-company':
          ActivityLogs.createCocLog({ coc: payload, type: 'company' });
          break;
      }
    }

    public static createCocLog({ coc, type }: { coc: any; type: string }) {
      let action = ACTIVITY_ACTIONS.CREATE;
      let content = '';

      if (coc.mergedIds && coc.mergedIds.length > 0) {
        action = ACTIVITY_ACTIONS.MERGE;
        content = coc.mergedIds;
      }

      return ActivityLogs.addActivityLog({
        type,
        content,
        typeId: coc._id,
        action,
        createdBy: coc.ownerId || coc.integrationId,
      });
    }

    /**
     * Create a customer or company segment log
     */
    // public static async createSegmentLog(segment: ISegmentDocument, customer?: ICustomerDocument) {
    //   if (!customer) {
    //     throw new Error('customer must be supplied');
    //   }

    //   const foundSegment = await ActivityLogs.findOne({
    //     'activity.type': ACTIVITY_TYPES.SEGMENT,
    //     'activity.action': ACTIVITY_ACTIONS.CREATE,
    //     'activity.id': segment._id,
    //     'contentType.type': segment.contentType,
    //     'contentType.id': customer._id,
    //   });

    //   if (foundSegment) {
    //     // since this type of activity log already exists, new one won't be created
    //     return foundSegment;
    //   }

    //   return this.createDoc({
    //     activity: {
    //       type: ACTIVITY_TYPES.SEGMENT,
    //       action: ACTIVITY_ACTIONS.CREATE,
    //       content: segment.name,
    //       id: segment._id,
    //     },
    //     contentType: {
    //       type: segment.contentType,
    //       id: customer._id,
    //     },
    //   });
    // }
  }

  activityLogSchema.loadClass(ActivityLog);

  return activityLogSchema;
};

loadClass();

// tslint:disable-next-line
const ActivityLogs = model<IActivityLogDocument, IActivityLogModel>('activity_logs', activityLogSchema);

export default ActivityLogs;
