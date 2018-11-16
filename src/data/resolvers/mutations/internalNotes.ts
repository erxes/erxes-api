import { IContext } from '../../../connectionResolver';
import { IInternalNote } from '../../../db/models/definitions/internalNotes';
import { moduleRequireLogin } from '../../permissions';

interface IInternalNotesEdit extends IInternalNote {
  _id: string;
}

const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(_root, args: IInternalNote, { user, models: { InternalNotes, ActivityLogs } }: IContext) {
    const internalNote = await InternalNotes.createInternalNote(args, user);

    await ActivityLogs.createInternalNoteLog(internalNote, user);

    return internalNote;
  },

  /**
   * Updates internalNote object
   */
  internalNotesEdit(_root, { _id, ...doc }: IInternalNotesEdit, { models: { InternalNotes } }: IContext) {
    return InternalNotes.updateInternalNote(_id, doc);
  },

  /**
   * Remove a channel
   */
  internalNotesRemove(_root, { _id }: { _id: string }, { models: { InternalNotes } }: IContext) {
    return InternalNotes.removeInternalNote(_id);
  },
};

moduleRequireLogin(internalNoteMutations);

export default internalNoteMutations;
