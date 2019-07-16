import { Companies, Customers, Deals, InternalNotes, Pipelines, Stages } from '../../../db/models';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleRequireLogin } from '../../permissions/wrappers';
import utils, { ISendNotification, putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user }: { user: IUserDocument }) {
    let notifDoc: ISendNotification = {
      title: `${args.contentType.toUpperCase()} updated`,
      createdUser: user,
      action: `mentioned you in`,
      receivers: args.mentionedUserIds || [],
      content: ``,
      link: ``,
      notifType: ``,
    };

    switch (args.contentType) {
      case 'deal': {
        const deal = await Deals.getDeal(args.contentTypeId);
        const stage = await Stages.getStage(deal.stageId || '');
        const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

        notifDoc = {
          ...notifDoc,
          notifType: NOTIFICATION_TYPES.DEAL_EDIT,
          content: ` "${deal.name}" deal`,
          link: `/${args.contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
        };
      }

      case 'customer': {
        const customer = await Customers.getCustomer(args.contentTypeId);

        notifDoc = {
          ...notifDoc,
          notifType: NOTIFICATION_TYPES.CUSTOMER_MENTION,
          content: `${customer.primaryEmail || customer.firstName || customer.lastName || customer.primaryPhone}`,
          link: `/contacts/customers/details/${customer._id}`,
        };
      }

      case 'company': {
        const company = await Companies.getCompany(args.contentTypeId);

        notifDoc = {
          ...notifDoc,
          notifType: NOTIFICATION_TYPES.CUSTOMER_MENTION,
          content: `${company.primaryName || company.primaryEmail || company.primaryPhone}`,
          link: `/contacts/companies/details/${company._id}`,
        };
      }

      default:
        break;
    }

    await utils.sendNotification(notifDoc);

    const internalNote = await InternalNotes.createInternalNote(args, user);

    if (internalNote) {
      await putCreateLog(
        {
          type: 'internalNote',
          newData: JSON.stringify(args),
          object: internalNote,
          description: `${internalNote.contentType} has been created`,
        },
        user,
      );
    }

    return internalNote;
  },

  /**
   * Updates internalNote object
   */
  async internalNotesEdit(_root, { _id, ...doc }: IInternalNotesEdit, { user }: { user: IUserDocument }) {
    const internalNote = await InternalNotes.findOne({ _id });
    const updated = await InternalNotes.updateInternalNote(_id, doc);

    if (internalNote) {
      await putUpdateLog(
        {
          type: 'internalNote',
          object: internalNote,
          newData: JSON.stringify(doc),
          description: `${internalNote.contentType} written at ${internalNote.createdDate} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove a channel
   */
  async internalNotesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const internalNote = await InternalNotes.findOne({ _id });
    const removed = await InternalNotes.removeInternalNote(_id);

    if (internalNote) {
      await putDeleteLog(
        {
          type: 'internalNote',
          object: internalNote,
          description: `${internalNote.contentType} written at ${internalNote.createdDate} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleRequireLogin(internalNoteMutations);

export default internalNoteMutations;
