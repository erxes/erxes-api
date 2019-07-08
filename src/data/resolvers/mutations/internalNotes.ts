import { Deals, InternalNotes, Pipelines, Stages } from '../../../db/models';
import { NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleRequireLogin } from '../../permissions/wrappers';
import utils, { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user }: { user: IUserDocument }) {
    switch (args.contentType) {
      case 'deal': {
        const deal = await Deals.getDeal(args.contentTypeId);
        const stage = await Stages.getStage(deal.stageId || '');
        const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

        const title = `${user.details ? user.details.fullName : 'Someone'} mentioned you in "${deal.name}" deal`;

        utils.sendNotification({
          createdUser: user._id,
          notifType: NOTIFICATION_TYPES.DEAL_EDIT,
          title,
          content: title,
          link: `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
          receivers: args.mentionedUserIds || [],
        });
      }

      default:
        break;
    }

    const internalNote = await InternalNotes.createInternalNote(args, user);

    if (internalNote) {
      await putCreateLog(
        {
          type: 'internalNote',
          newData: JSON.stringify(args),
          objectId: internalNote._id,
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
          objectId: _id,
          oldData: JSON.stringify(internalNote),
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
          oldData: JSON.stringify(internalNote),
          objectId: _id,
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
