import { createConnection } from 'mongoose';
import { connect } from '../db/connection';
import { ActivityLogs, EngageMessages, InternalNotes } from '../db/models';

/**
 * Rename createdDate field to createdAt
 *
 */

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
};

module.exports.up = async () => {
  await connect();

  const mongoClient = await createConnection(process.env.MONGO_URL || '', options);

  await InternalNotes.updateMany({}, { $rename: { createdDate: 'createdAt' } });
  await EngageMessages.updateMany({}, { $rename: { createdDate: 'createdAt' } });

  const activityLogs = mongoClient.db.collection('activity_logs');

  const activities: any = await activityLogs.find({ 'activity.action': { $in: ['merge', 'create'] } }).toArray();

  for (const activity of activities) {
    if (activity.activity) {
      const { action, content, id, type } = activity.activity;
      const contentType = activity.contentType;

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

      if (type === 'segment') {
        await ActivityLogs.create({
          contentId: contentType.id,
          contentType: contentType.type,
          content: {
            id,
            content,
          },
          action: 'segment',
          createdBy: performedBy.id,
          createdAt: activity.createdAt,
        });

        await ActivityLogs.deleteOne({ _id: activity._id });
      }

      if (action === 'create' && type !== 'segment' && type !== 'conversation' && type !== 'internal_note') {
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
