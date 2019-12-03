import { connect } from '../db/connection';
import { ActivityLogs, EngageMessages, InternalNotes } from '../db/models';

/**
 * Rename createdDate field to createdAt
 *
 */
module.exports.up = async () => {
  await connect();

  await InternalNotes.updateMany({}, { $rename: { createdDate: 'createdAt' } });
  await EngageMessages.updateMany({}, { $rename: { createdDate: 'createdAt' } });

  const acitivities = await ActivityLogs.find({});

  acitivities.map(async activity => {
    if (activity.activity.action === 'create') {
      const type = activity.activity.type;

      await ActivityLogs.update({ _id: activity._id }, { $set: { contentType: type } });
    }
  });
};
