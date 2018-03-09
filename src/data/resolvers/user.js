import { Permissions } from '../../db/models';
import _ from 'underscore';

export default {
  async permissionActions(user) {
    const actions = await Permissions.find({
      $or: [{ userId: user._id }, { groupId: { $in: user.groupIds } }],
    }).select('action');

    return _.uniq(_.pluck(actions, 'action'));
  },
};
