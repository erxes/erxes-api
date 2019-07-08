import { Permissions, Users, UsersGroups } from '../../../db/models';
import { IPermissionParams, IUserGroup } from '../../../db/models/definitions/permissions';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { resetPermissionsCache } from '../../permissions/utils';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

const permissionMutations = {
  /**
   * Create new permission
   * @param {String} doc.module
   * @param {[String]} doc.actions
   * @param {[String]} doc.userIds
   * @param {Boolean} doc.allowed
   * @return {Promise} newly created permission object
   */
  async permissionsAdd(_root, doc: IPermissionParams, { user }: { user: IUserDocument }) {
    const result = await Permissions.createPermission(doc);

    if (result && result.length > 0) {
      result.forEach(async perm => {
        let description = `Permission of module "${perm.module}", action "${perm.action}" assigned to `;

        if (perm.groupId) {
          const group = await UsersGroups.findOne({ _id: perm.groupId });

          if (group && group.name) {
            description = `${description} user group "${group.name}" `;
          }
        }

        if (perm.userId) {
          const permUser = await Users.findOne({ _id: perm.userId });

          if (permUser) {
            description = `${description} user "${permUser.email}" has been created`;
          }
        }

        await putLog({
          createdBy: user._id,
          type: 'permission',
          action: LOG_ACTIONS.CREATE,
          objectId: perm._id,
          newData: JSON.stringify(perm),
          unicode: user.username || user.email || user._id,
          description,
        });
      });
    } // end result checking

    resetPermissionsCache();

    return result;
  },

  /**
   * Remove permission
   * @param {[String]} ids
   * @return {Promise}
   */
  async permissionsRemove(_root, { ids }: { ids: string[] }, { user }: { user: IUserDocument }) {
    const permissions = await Permissions.find({ _id: { $in: ids } });
    const result = await Permissions.removePermission(ids);

    for (const perm of permissions) {
      let description = `Permission of module "${perm.module}", action "${perm.action}" assigned to `;

      // prepare user group related description
      if (perm.groupId) {
        const group = await UsersGroups.findOne({ _id: perm.groupId });

        if (group && group.name) {
          description = `${description} user group "${group.name}" has been removed`;
        }
      }

      // prepare user related description
      if (perm.userId) {
        const permUser = await Users.findOne({ _id: perm.userId });

        if (permUser && permUser.email) {
          description = `${description} user "${permUser.email}" has been removed`;
        }
      }

      await putLog({
        createdBy: user._id,
        type: 'permission',
        action: LOG_ACTIONS.DELETE,
        objectId: perm._id,
        oldData: JSON.stringify(perm),
        unicode: user.username || user.email || user._id,
        description,
      });
    } // end for loop

    resetPermissionsCache();

    return result;
  },
};

const usersGroupMutations = {
  /**
   * Create new group
   * @param {String} doc.name
   * @param {String} doc.description
   * @return {Promise} newly created group object
   */
  async usersGroupsAdd(
    _root,
    { memberIds, ...doc }: IUserGroup & { memberIds?: string[] },
    { user }: { user: IUserDocument },
  ) {
    const result = await UsersGroups.createGroup(doc, memberIds);

    if (result) {
      await putLog({
        createdBy: user._id,
        type: 'userGroup',
        action: LOG_ACTIONS.CREATE,
        objectId: result._id,
        newData: JSON.stringify(doc),
        unicode: user.username || user.email || user._id,
        description: `${result.name} has been created`,
      });
    }

    resetPermissionsCache();

    return result;
  },

  /**
   * Edit group
   * @param {String} doc.name
   * @param {String} doc.description
   * @return {Promise} updated group object
   */
  async usersGroupsEdit(
    _root,
    { _id, memberIds, ...doc }: { _id: string; memberIds?: string[] } & IUserGroup,
    { user }: { user: IUserDocument },
  ) {
    const group = await UsersGroups.findOne({ _id });
    const result = await UsersGroups.updateGroup(_id, doc, memberIds);

    if (group && result) {
      await putLog({
        createdBy: user._id,
        type: 'userGroup',
        action: LOG_ACTIONS.UPDATE,
        oldData: JSON.stringify(group),
        newData: JSON.stringify(doc),
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${group.name} has been edited`,
      });
    }

    resetPermissionsCache();

    return result;
  },

  /**
   * Remove group
   * @param {String} _id
   * @return {Promise}
   */
  async usersGroupsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const group = await UsersGroups.findOne({ _id });
    const result = await UsersGroups.removeGroup(_id);

    if (group && result) {
      await putLog({
        createdBy: user._id,
        type: 'userGroup',
        action: LOG_ACTIONS.DELETE,
        oldData: JSON.stringify(group),
        unicode: user.username || user.email || user._id,
        description: `${group.name} has been removed`,
      });
    }

    resetPermissionsCache();

    return result;
  },
};

moduleCheckPermission(permissionMutations, 'managePermissions');
moduleCheckPermission(usersGroupMutations, 'manageUsersGroups');

export { permissionMutations, usersGroupMutations };
