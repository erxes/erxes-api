import { InternalNotes } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const internalNoteQueries = {
  internalNoteDetail(_root, { _id }: { _id: string }) {
    return InternalNotes.findOne({ _id });
  },

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
