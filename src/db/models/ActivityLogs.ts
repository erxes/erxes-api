import { Model, model } from 'mongoose';
import { graphqlPubsub } from '../../pubsub';
import { activityLogSchema, IActivityLogDocument, IActivityLogInput } from './definitions/activityLogs';
import { IChecklistDocument } from './definitions/checklists';

import { IItemCommonFieldsDocument } from './definitions/boards';
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
        action: 'CREATE',
        createdBy: item.userId || '',
      });
    }

    // public static createLogFromWidget(type: string, payload) {
    //   switch (type) {
    //     case 'create-customer':
    //       ActivityLogs.createCustomerLog(payload);
    //       break;
    //     case 'create-company':
    //       ActivityLogs.createCompanyLog(payload);
    //       break;
    //     case 'create-conversation':
    //       ActivityLogs.createConversationLog(payload);
    //       break;
    //   }
    // }

    /**
     * Create a conversation log for a given customer,
     * if the customer is related to companies,
     * then create conversation log with all related companies
     */
    // public static async createConversationLog(conversation: IConversationDocument) {
    //   const customer = await Customers.findOne({ _id: conversation.customerId });

    //   if (!customer || !customer._id) {
    //     return;
    //   }

    //   const companyIds = await Conformities.savedConformity({
    //     mainType: 'customer',
    //     mainTypeId: customer._id,
    //     relType: 'company',
    //   });

    //   for (const companyId of companyIds) {
    //     // check against duplication
    //     const log = await cocFindOne(conversation._id, companyId, ACTIVITY_CONTENT_TYPES.COMPANY);

    //     if (!log) {
    //       await cocCreate(conversation._id, conversation.content || '', companyId, ACTIVITY_CONTENT_TYPES.COMPANY);
    //     }
    //   }

    //   // check against duplication ======
    //   const foundLog = await cocFindOne(conversation._id, customer._id, ACTIVITY_CONTENT_TYPES.CUSTOMER);

    //   if (!foundLog) {
    //     return cocCreate(conversation._id, conversation.content || '', customer._id, ACTIVITY_CONTENT_TYPES.CUSTOMER);
    //   }
    // }

    // public static createCustomerLog(customer: ICustomerDocument) {
    //   let performer;

    //   if (customer.ownerId) {
    //     performer = {
    //       type: ACTIVITY_PERFORMER_TYPES.USER,
    //       id: customer.ownerId,
    //     };
    //   }

    //   let action = ACTIVITY_ACTIONS.CREATE;
    //   let content = `${customer.firstName || ''} ${customer.lastName || ''}`;

    //   if (customer.mergedIds && customer.mergedIds.length > 0) {
    //     action = ACTIVITY_ACTIONS.MERGE;
    //     content = customer.mergedIds.toString();
    //   }

    //   return ActivityLogs.createDoc({
    //     activity: {
    //       type: ACTIVITY_TYPES.CUSTOMER,
    //       action,
    //       content,
    //       id: customer._id,
    //     },
    //     contentType: {
    //       type: ACTIVITY_CONTENT_TYPES.CUSTOMER,
    //       id: customer._id,
    //     },
    //     performer,
    //   });
    // }

    // public static createCompanyLog(company: ICompanyDocument) {
    //   let performer;

    //   if (company.ownerId) {
    //     performer = {
    //       type: ACTIVITY_PERFORMER_TYPES.USER,
    //       id: company.ownerId,
    //     };
    //   }

    //   let action = ACTIVITY_ACTIONS.CREATE;
    //   let content = company.primaryName || '';

    //   if (company.mergedIds && company.mergedIds.length > 0) {
    //     action = ACTIVITY_ACTIONS.MERGE;
    //     content = company.mergedIds.toString();
    //   }

    //   return ActivityLogs.createDoc({
    //     activity: {
    //       type: ACTIVITY_TYPES.COMPANY,
    //       action,
    //       content,
    //       id: company._id,
    //     },
    //     contentType: {
    //       type: ACTIVITY_CONTENT_TYPES.COMPANY,
    //       id: company._id,
    //     },
    //     performer,
    //   });
    // }

    // public static createEmailDeliveryLog(email: IEmailDeliveriesDocument) {
    //   return ActivityLogs.createDoc({
    //     activity: {
    //       id: Math.random().toString(),
    //       type: ACTIVITY_TYPES.EMAIL,
    //       action: ACTIVITY_ACTIONS.SEND,
    //       content: email.body,
    //     },
    //     contentType: {
    //       type: email.cocType,
    //       id: email.cocId || '',
    //     },
    //     performer: {
    //       type: ACTIVITY_PERFORMER_TYPES.USER,
    //       id: email.userId,
    //     },
    //   });
    // }

    // public static createInternalNoteLog(internalNote: IInternalNoteDocument) {
    //   return ActivityLogs.createDoc({
    //     activity: {
    //       type: ACTIVITY_TYPES.INTERNAL_NOTE,
    //       action: ACTIVITY_ACTIONS.CREATE,
    //       content: internalNote.content,
    //       id: internalNote._id,
    //     },
    //     contentType: {
    //       type: internalNote.contentType,
    //       id: internalNote.contentTypeId,
    //     },
    //     performer: {
    //       type: ACTIVITY_PERFORMER_TYPES.USER,
    //       id: internalNote.createdUserId,
    //     },
    //   });
    // }

    // public static createChecklistLog(checklist: IChecklistDocument) {
    //   return ActivityLogs.createDoc({
    //     activity: {
    //       type: ACTIVITY_TYPES.CHECKLIST,
    //       action: ACTIVITY_ACTIONS.CREATE,
    //       content: checklist.title,
    //       id: checklist._id,
    //     },
    //     contentType: {
    //       type: checklist.contentType,
    //       id: checklist.contentTypeId,
    //     },
    //     performer: {
    //       type: ACTIVITY_PERFORMER_TYPES.USER,
    //       id: checklist.createdUserId,
    //     },
    //   });
    // }

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
