import { Segments } from '../../../db/models';
import { ISegment } from '../../../db/models/definitions/segments';
import { MODULE_NAMES } from '../../constants';
import { gatherSegmentNames, LogDesc, putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ISegmentsEdit extends ISegment {
  _id: string;
}

const segmentMutations = {
  /**
   * Create new segment
   */
  async segmentsAdd(_root, doc: ISegment, { user, docModifier }: IContext) {
    const extendedDoc = docModifier(doc);
    const segment = await Segments.createSegment(extendedDoc);

    let extraDesc: LogDesc[] = [];

    if (doc.subOf) {
      extraDesc = await gatherSegmentNames({
        idFields: [doc.subOf],
        foreignKey: 'subOf',
      });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.SEGMENT,
        newData: doc,
        object: segment,
        description: `"${segment.name}" has been created`,
        extraDesc,
      },
      user,
    );

    return segment;
  },

  /**
   * Update segment
   */
  async segmentsEdit(_root, { _id, ...doc }: ISegmentsEdit, { user }: IContext) {
    const segment = await Segments.getSegment(_id);
    const updated = await Segments.updateSegment(_id, doc);

    const parentIds: string[] = [];

    if (segment.subOf) {
      parentIds.push(segment.subOf);
    }

    if (doc.subOf && doc.subOf !== segment.subOf) {
      parentIds.push(doc.subOf);
    }

    let extraDesc: LogDesc[] = [];

    if (parentIds.length > 0) {
      extraDesc = await gatherSegmentNames({
        idFields: parentIds,
        foreignKey: 'subOf',
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.SEGMENT,
        object: segment,
        newData: doc,
        description: `"${segment.name}" has been edited`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Delete segment
   */
  async segmentsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const segment = await Segments.getSegment(_id);
    const removed = await Segments.removeSegment(_id);

    let extraDesc: LogDesc[] = [];

    if (segment.subOf) {
      extraDesc = await gatherSegmentNames({
        idFields: [segment.subOf],
        foreignKey: 'subOf',
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.SEGMENT,
        object: segment,
        description: `"${segment.name}" has been removed`,
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(segmentMutations, 'manageSegments');

export default segmentMutations;
