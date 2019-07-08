import * as moment from 'moment';
import * as schedule from 'node-schedule';
import utils from '../data/utils';
import { Deals, Pipelines, Stages, Users } from '../db/models';
import { NOTIFICATION_TYPES } from '../db/models/definitions/constants';

/**
 * Send notification Deals dueDate
 */
export const sendNotifications = async () => {
  const now = new Date();

  const deals = await Deals.find({
    closeDate: {
      $gte: now,
      $lte: moment(now)
        .add(24, 'hour')
        .toDate(),
    },
  });

  for (const deal of deals) {
    const stage = await Stages.findOne({ _id: deal.stageId });

    if (!stage) {
      throw new Error('Stage not found');
    }

    const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    const user = await Users.findOne({ _id: deal.modifiedBy });

    if (!user) {
      return;
    }

    const content = `'${deal.name}' deal is due in upcoming`;

    utils.sendNotification({
      notifType: NOTIFICATION_TYPES.DEAL_DUE_DATE,
      title: content,
      content,
      action: `Reminder:`,
      link: `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
      createdUser: user,
      // exclude current user
      receivers: deal.assignedUserIds || [],
    });
  }
};

export default {
  sendNotifications,
};

/**
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    |
 * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * └───────────────────────── second (0 - 59, OPTIONAL)
 */
// every day in 23:45:00
schedule.scheduleJob('0 45 23 * * *', () => {
  sendNotifications();
});
