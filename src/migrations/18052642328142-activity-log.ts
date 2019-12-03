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

  const activities: any = await ActivityLogs.find({ 'activity.action': { $in: ['merge', 'create'] } });

  for (let activity of activities) {
    activity = activity.toJSON();

    if (activity.activity) {
      const { action, content, id, type } = activity.activity;
      const { performedBy } = activity;

      if (action === 'merge') {
        await ActivityLogs.create({
          contentId: id,
          contentType: type,
          content: content.split(','),
          action,
          createdBy: performedBy.id,
          createdAt: activity.createdAt,
        });

        await ActivityLogs.deleteOne({ _id: activity._id });
      }

      if (action === 'create' && type !== 'conversation' && type !== 'internal_note') {
        await ActivityLogs.create({
          contentId: id,
          contentType: type,
          action,
          createdBy: performedBy.id,
          createdAt: activity.createdAt,
        });

        await ActivityLogs.deleteOne({ _id: activity._id });
      }
    }
  }

  return ActivityLogs.deleteMany({ performedBy: { $exists: true } });
};
