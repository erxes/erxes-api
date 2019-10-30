import { InternalNotes } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const internalNoteQueries = {
  /**
   * InternalNotes list
   */
  internalNotes(_root) {
    return InternalNotes.find({}).sort({
      createdDate: 1,
    });
  },
};

moduleRequireLogin(internalNoteQueries);

export default internalNoteQueries;
