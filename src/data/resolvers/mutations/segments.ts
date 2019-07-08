import { Segments } from '../../../db/models';
import { ISegment } from '../../../db/models/definitions/segments';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface ISegmentsEdit extends ISegment {
  _id: string;
}

const segmentMutations = {
  /**
   * Create new segment
   */
  async segmentsAdd(_root, doc: ISegment, { user }: { user: IUserDocument }) {
    const segment = await Segments.createSegment(doc);

    if (segment) {
      await putLog(
        {
          type: 'segment',
          action: LOG_ACTIONS.CREATE,
          newData: JSON.stringify(doc),
          objectId: segment._id,
          description: `${segment.name} has been created`,
        },
        user,
      );
    }

    return segment;
  },

  /**
   * Update segment
   */
  async segmentsEdit(_root, { _id, ...doc }: ISegmentsEdit, { user }: { user: IUserDocument }) {
    const segment = await Segments.findOne({ _id });
    const updated = await Segments.updateSegment(_id, doc);

    if (segment && updated) {
      await putLog(
        {
          type: 'segment',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(segment),
          newData: JSON.stringify(doc),
          objectId: _id,
          description: `${segment.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Delete segment
   */
  async segmentsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const segment = await Segments.findOne({ _id });
    const removed = await Segments.removeSegment(_id);

    if (segment) {
      await putLog(
        {
          type: 'segment',
          action: LOG_ACTIONS.DELETE,
          oldData: JSON.stringify(segment),
          newData: '',
          objectId: _id,
          description: `${segment.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(segmentMutations, 'manageSegments');

export default segmentMutations;
