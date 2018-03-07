import { Users, UsersGroups } from '../../db/models';

export default {
  user(entry) {
    return Users.findOne({ _id: entry.userId });
  },

  group(entry) {
    return UsersGroups.findOne({ _id: entry.groupId });
  },
};
