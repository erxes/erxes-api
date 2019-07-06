import { InternalNotes } from '../../../db/models';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user }: { user: IUserDocument }) {
    const internalNote = await InternalNotes.createInternalNote(args, user);

    if (internalNote) {
      await putLog({
        createdBy: user._id,
        type: 'internalNote',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(args),
        objectId: internalNote._id,
        unicode: user.username || user.email || user._id,
        description: `${internalNote.contentType} has been created`,
      });
    }

    return internalNote;
  },

  /**
   * Updates internalNote object
   */
  async internalNotesEdit(_root, { _id, ...doc }: IInternalNotesEdit, { user }: { user: IUserDocument }) {
    const internalNote = await InternalNotes.findOne({ _id });
    const updated = await InternalNotes.updateInternalNote(_id, doc);

    if (internalNote && updated) {
      await putLog({
        createdBy: user._id,
        type: 'internalNote',
        action: LOG_ACTIONS.UPDATE,
        objectId: _id,
        oldData: JSON.stringify(internalNote),
        newData: JSON.stringify(doc),
        unicode: user.username || user.email || user._id,
        description: `${internalNote.contentType} written at ${internalNote.createdDate} has been edited`,
      });
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
      await putLog({
        createdBy: user._id,
        type: 'internalNote',
        action: LOG_ACTIONS.DELETE,
        oldData: JSON.stringify(internalNote),
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${internalNote.contentType} written at ${internalNote.createdDate} has been removed`,
      });
    }

    return removed;
  },
};

moduleRequireLogin(internalNoteMutations);

export default internalNoteMutations;
