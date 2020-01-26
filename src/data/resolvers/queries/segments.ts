import { Segments } from '../../../db/models';
import { fetchElk } from '../../../elasticsearch';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const segmentQueries = {
  /**
   * Segments list
   */
  segments(_root, { contentType }: { contentType: string }, { commonQuerySelector }: IContext) {
    return Segments.find({ ...commonQuerySelector, contentType }).sort({ name: 1 });
  },

  /**
   * Only segment that has no sub segments
   */
  async segmentsGetHeads(_root, _args, { commonQuerySelector }: IContext) {
    return Segments.find({ ...commonQuerySelector, $or: [{ subOf: { $exists: false } }, { subOf: '' }] });
  },

  /**
   * Get one segment
   */
  segmentDetail(_root, { _id }: { _id: string }) {
    return Segments.findOne({ _id });
  },

  /**
   * Get event names
   */
  async segmentsEventNames(_root) {
    const events = await fetchElk('search', 'events', {
      aggs: {
        names: {
          terms: {
            field: 'name.keyword',
          },
        },
      },
      size: 0,
    });

    return events.aggregations.names.buckets.map(bucket => bucket.key);
  },
};

requireLogin(segmentQueries, 'segmentsGetHeads');
requireLogin(segmentQueries, 'segmentDetail');
requireLogin(segmentQueries, 'segmentsEventNames');

checkPermission(segmentQueries, 'segments', 'showSegments', []);

export default segmentQueries;
