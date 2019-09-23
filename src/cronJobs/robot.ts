import * as schedule from 'node-schedule';
import { Users } from '../db/models';
import { OnboardingHistories } from '../db/models/Robot';
import { debugCrons } from '../debuggers';
import { sendMessage } from './messageBroker';

export const checkOnboarding = async () => {
  const users = await Users.find({}).lean();

  for (const user of users) {
    const entry = await OnboardingHistories.findOne({ userId: user._id });

    if (entry && entry.isCompleted) {
      continue;
    }

    let type = 'initial';

    if (entry) {
      type = 'inComplete';
    }

    sendMessage('callPublish', {
      name: 'onboardingChanged',
      data: {
        onboardingChanged: {
          userId: user._id,
          type,
        },
      },
    });
  }
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
schedule.scheduleJob('*/10 * * * * *', () => {
  debugCrons('Checked onboarding');

  checkOnboarding();
});
