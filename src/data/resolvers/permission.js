import { Users } from '../../db/models';

export default {
  user(entry) {
    return Users.findOne({ _id: entry.userId });
  },
};
