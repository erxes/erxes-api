import { UsersGroups } from '../../../db/models';
import { requireLogin } from '../../permissions';
import { paginate } from './utils';

const usersGroupQueries = {
  /**
   * Users groups list
   * @param {Object} args - Search params
   * @return {Promise} sorted and filtered users objects
   */
  usersGroups(root, args) {
    const users = paginate(UsersGroups.find({}), args);
    return users.sort({ name: 1 });
  },

  /**
   * Get all groups list. We will use it in pager
   * @return {Promise} total count
   */
  usersGroupsTotalCount() {
    return UsersGroups.find({}).count();
  },
};

requireLogin(usersGroupQueries, 'usersGroups');
requireLogin(usersGroupQueries, 'usersGroupsTotalCount');

export default usersGroupQueries;
