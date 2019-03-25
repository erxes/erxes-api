import { InternalNotes, ActivityLogs } from '../models';
import { ACTIVITY_ACTIONS, ACTIVITY_PERFORMER_TYPES, ACTIVITY_TYPES } from '../models/definitions/constants';

const InternalNoteListeners = () =>
  InternalNotes.watch().on('change', data => {
    const internalNote = data.fullDocument;

    if (data.operationType === 'insert' && internalNote) {
      ActivityLogs.createDoc({
        activity: {
          type: ACTIVITY_TYPES.INTERNAL_NOTE,
          action: ACTIVITY_ACTIONS.CREATE,
          content: internalNote.content,
          id: internalNote._id,
        },
        coc: {
          type: internalNote.contentType,
          id: internalNote.contentTypeId,
        },
        performer: {
          type: ACTIVITY_PERFORMER_TYPES.USER,
          id: internalNote.createdUserId,
        },
      });
    }
  });

export default InternalNoteListeners;
