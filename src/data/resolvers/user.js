import { Permissions } from '../../db/models';
import _ from 'underscore';

export default {
  async permissionActions(user) {
    const actions = await Permissions.find({ userId: user._id }).select('action');

    return _.pluck(actions, 'action');
  },
};
