import { connect } from '../db/connection';
import { InternalNotes } from '../db/models';

/**
 * Rename createdDate field to createdAt
 *
 */
module.exports.up = async () => {
  await connect();

  return InternalNotes.updateMany({}, { $rename: { createdDate: 'createdAt' } });
};
