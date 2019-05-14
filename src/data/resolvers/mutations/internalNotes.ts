import { InternalNotes } from '../../../db/models';
import { ACTIVITY_CONTENT_TYPES, NOTIFICATION_TYPES } from '../../../db/models/definitions/constants';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleRequireLogin } from '../../permissions';
import utils from '../../utils';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user }: { user: IUserDocument }) {
    const internalNote = await InternalNotes.createInternalNote(args, user);

    if (internalNote.mentionedUserIds) {
      // send notification =======
      const title = 'You have a new message.';

      let notifType;
      let link;

      switch (internalNote.contentType) {
        case ACTIVITY_CONTENT_TYPES.CUSTOMER: {
          notifType = NOTIFICATION_TYPES.CUSTOMER_USER_MENTIONED;
          link = `/contacts/customers/details/${internalNote.contentTypeId}`;

          break;
        }
        case ACTIVITY_CONTENT_TYPES.COMPANY: {
          notifType = NOTIFICATION_TYPES.COMPANY_USER_MENTIONED;
          link = `/contacts/companies/details/${internalNote.contentTypeId}`;

          break;
        }
        case ACTIVITY_CONTENT_TYPES.DEAL: {
          notifType = NOTIFICATION_TYPES.DEAL_USER_MENTIONED;
          link = '/deal';

          break;
        }
        case ACTIVITY_CONTENT_TYPES.USER: {
          notifType = NOTIFICATION_TYPES.TEAM_MEMBER_MENTIONED;
          link = `/settings/team/details/${internalNote.contentTypeId}`;

          break;
        }
        default:
      }

      utils.sendNotification({
        createdUser: user._id,
        notifType,
        title,
        content: internalNote.content,
        link,
        receivers: internalNote.mentionedUserIds,
      });
    }

    return internalNote;
  },

  /**
   * Updates internalNote object
   */
  internalNotesEdit(_root, { _id, ...doc }: IInternalNotesEdit) {
    return InternalNotes.updateInternalNote(_id, doc);
  },

  /**
   * Remove a channel
   */
  internalNotesRemove(_root, { _id }: { _id: string }) {
    return InternalNotes.removeInternalNote(_id);
  },
};

moduleRequireLogin(internalNoteMutations);

export default internalNoteMutations;
