import { Permissions } from '../../../db/models';
import { checkPermission } from '../../permissions';

const permissionMutations = {
  /**
  * Create new permission
  * @param {String} doc.module
  * @param {[String]} doc.actions
  * @param {[String]} doc.userIds
  * @param {Boolean} doc.allowed
  * @return {Promise} newly created permission object
  */
  permissionsAdd(root, doc) {
    return Permissions.createPermission(doc);
  },

  /**
  * Remove permission
  * @param {[String]} ids
  * @return {Promise}
  */
  permissionsRemove(root, { ids }) {
    return Permissions.removePermission(ids);
  },
};

checkPermission(permissionMutations, 'permissionsAdd', 'configPermission');
checkPermission(permissionMutations, 'permissionsRemove', 'configPermission');

export default permissionMutations;
