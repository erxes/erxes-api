import { connect } from '../src/db/connection';
import { ConversationMessages } from '../src/db/models';

/**
 * Updating every post and parent comment's commentCount to 101 by static
 *
 */
module.exports.up = async () => {
  await connect();

  await ConversationMessages.updateMany({ 'facebookData.isPost': true }, { 'facebookData.commentCount': 101 });

  await ConversationMessages.updateMany(
    {
      $and: [{ 'facebookData.commentId': { $exists: true } }, { 'facebookData.parentId': { $exists: false } }],
    },
    { 'facebookData.commentCount': 101 },
  );

  return Promise.resolve('done');
};
