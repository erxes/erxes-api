import * as moment from 'moment';
import * as schedule from 'node-schedule';
import utils from '../data/utils';
import { Deals, Pipelines, Stages } from '../db/models';
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
    const stage = await Stages.getStage(deal.stageId || '');
    const pipeline = await Pipelines.getPipeline(stage.pipelineId || '');

    const content = `Reminder: '${deal.name}' deal is due in upcoming`;

    utils.sendNotification({
      notifType: NOTIFICATION_TYPES.DEAL_DUE_DATE,
      title: content,
      content,
      link: `/deal/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}`,
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
