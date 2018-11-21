import { EngageMessages, Users } from '../../../db/models';
import { IEngageMessage } from '../../../db/models/definitions/engages';
import { createSchedule, ENGAGE_SCHEDULES } from '../../../trackers/engageScheduleTracker';
import { awsRequests } from '../../../trackers/engageTracker';
import { MESSAGE_KINDS, METHODS } from '../../constants';
import { moduleRequireLogin } from '../../permissions';
import { send } from './engageUtils';

interface IEngageMessageEdit extends IEngageMessage {
  _id: string;
}

/**
 * Update or Remove selected engage message
 * @param _id - Engage id
 * @param update - Action type
 */
export const updateOrRemoveSchedule = async ({ _id }: { _id: string }, update?: boolean) => {
  const selectedIndex = ENGAGE_SCHEDULES.findIndex(engage => engage.id === _id);

  if (selectedIndex === -1) {
    return;
  }

  // Remove selected job instance and update tracker
  ENGAGE_SCHEDULES[selectedIndex].job.cancel();
  ENGAGE_SCHEDULES.splice(selectedIndex, 1);

  if (!update) {
    return;
  }

  const message = await EngageMessages.findOne({ _id });

  if (!message) {
    return;
  }

  return createSchedule(message);
};

const engageMutations = {
  /**
   * Create new message
   */
  async engageMessageAdd(_root, doc: IEngageMessage) {
    const { method, fromUserId } = doc;

    if (method === METHODS.EMAIL) {
      // Checking if configs exist
      const { AWS_SES_CONFIG_SET = '', AWS_ENDPOINT = '' } = process.env;

      if (AWS_SES_CONFIG_SET === '' || AWS_ENDPOINT === '') {
        throw new Error('Could not locate configs on AWS SES');
      }

      const user = await Users.findOne({ _id: fromUserId });

      const { VerifiedEmailAddresses = [] } = await awsRequests.getVerifiedEmails();

      // If verified creates engagemessage
      if (user && !VerifiedEmailAddresses.includes(user.email)) {
        throw new Error('Email not verified');
      }
    }

    const engageMessage = await EngageMessages.createEngageMessage(doc);

    // if manual and live then send immediately
    if (doc.kind === MESSAGE_KINDS.MANUAL && doc.isLive) {
      await send(engageMessage);
    }

    return engageMessage;
  },

  /**
   * Edit message
   */
  async engageMessageEdit(_root, { _id, ...doc }: IEngageMessageEdit) {
    await EngageMessages.updateEngageMessage(_id, doc);

    updateOrRemoveSchedule({ _id }, true);

    return EngageMessages.findOne({ _id });
  },

  /**
   * Remove message
   */
  engageMessageRemove(_root, { _id }: { _id: string }) {
    updateOrRemoveSchedule({ _id });
    return EngageMessages.removeEngageMessage(_id);
  },

  /**
   * Engage message set live
   */
  async engageMessageSetLive(_root, { _id }: { _id: string }) {
    const engageMessage = await EngageMessages.engageMessageSetLive(_id);

    const { kind } = engageMessage;

    if (kind === MESSAGE_KINDS.AUTO || kind === MESSAGE_KINDS.VISITOR_AUTO) {
      createSchedule(engageMessage);
    }

    return engageMessage;
  },

  /**
   * Engage message set pause
   */
  engageMessageSetPause(_root, { _id }: { _id: string }) {
    return EngageMessages.engageMessageSetPause(_id);
  },

  /**
   * Engage message set live manual
   */
  async engageMessageSetLiveManual(_root, { _id }: { _id: string }) {
    const engageMessage = await EngageMessages.engageMessageSetLive(_id);

    await send(engageMessage);

    return engageMessage;
  },
};

moduleRequireLogin(engageMutations);

export default engageMutations;
