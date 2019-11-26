import * as admin from 'firebase-admin';
import { Customers, Users } from '../db/models';

/**
 * Send notification to mobile device from inbox conversations
 * @param {string} - title
 * @param {string} - body
 * @param {string} - customerId
 * @param {array} - receivers
 */
export const sendMobileNotification = async ({
  receivers,
  title,
  body,
  customerId,
  conversationId,
}: {
  receivers: string[];
  customerId?: string;
  title: string;
  body: string;
  conversationId: string;
}): Promise<void> => {
  if (!admin.apps.length) {
    return;
  }

  const transporter = admin.messaging();
  const tokens: string[] = [];

  if (receivers && receivers.length > 0) {
    tokens.push(...(await Users.find({ _id: { $in: receivers } }).distinct('deviceTokens')));
  }

  if (customerId) {
    tokens.push(...(await Customers.findOne({ _id: customerId }).distinct('deviceTokens')));
  }

  if (tokens.length > 0) {
    // send notification
    for (const token of tokens) {
      await transporter.send({ token, notification: { title, body }, data: { conversationId } });
    }
  }
};
