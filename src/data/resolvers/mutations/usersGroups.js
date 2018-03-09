import { UsersGroups } from '../../../db/models';
import { checkPermission } from '../../permissions';

const usersGroupMutations = {
  /**
  * Create new group
  * @param {String} doc.name
  * @param {String} doc.description
  * @return {Promise} newly created group object
  */
  usersGroupsAdd(root, doc) {
    return UsersGroups.createGroup(doc);
  },

  /**
  * Edit group
  * @param {String} doc.name
  * @param {String} doc.description
  * @return {Promise} updated group object
  */
  usersGroupsEdit(root, { _id, ...doc }) {
    return UsersGroups.updateGroup(_id, doc);
  },

  /**
  * Remove group
  * @param {String} _id
  * @return {Promise}
  */
  usersGroupsRemove(root, { _id }) {
    return UsersGroups.removeGroup(_id);
  },
};

checkPermission(usersGroupMutations, 'usersGroupsAdd', 'addUserGroups');
checkPermission(usersGroupMutations, 'usersGroupsEdit', 'editUserGroups');
checkPermission(usersGroupMutations, 'usersGroupsRemove', 'removeUserGroups');

export default usersGroupMutations;
