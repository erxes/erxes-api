import { IContext } from '../../../connectionResolver';
import { ISegment } from '../../../db/models/definitions/segments';
import { moduleRequireLogin } from '../../permissions';

interface ISegmentsEdit extends ISegment {
  _id: string;
}

const segmentMutations = {
  /**
   * Create new segment
   */
  segmentsAdd(_root, doc: ISegment, { models: { Segments } }: IContext) {
    return Segments.createSegment(doc);
  },

  /**
   * Update segment
   */
  async segmentsEdit(_root, { _id, ...doc }: ISegmentsEdit, { models: { Segments } }: IContext) {
    return Segments.updateSegment(_id, doc);
  },

  /**
   * Delete segment
   */
  async segmentsRemove(_root, { _id }: { _id: string }, { models: { Segments } }: IContext) {
    return Segments.removeSegment(_id);
  },
};

moduleRequireLogin(segmentMutations);

export default segmentMutations;
