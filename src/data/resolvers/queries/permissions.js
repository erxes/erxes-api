import { Permissions } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions';
import { ModulesMap, ActionsMap } from '../../permissions/utils';
import _ from 'underscore';
import { paginate } from './utils';

const generateSelector = ({ module, action, userId, groupId }) => {
  const filter = {};

  if (module) filter.module = module;

  if (action) filter.action = action;

  if (userId) filter.userId = userId;

  if (groupId) filter.groupId = groupId;

  return filter;
};

const permissionQueries = {
  /**
   * Permissions list
   * @param {Object} args
   * @param {String} args.module
   * @param {String} args.action
   * @param {String} args.userId
   * @param {Int} args.page
   * @param {Int} args.perPage
   * @return {Promise} filtered permissions list by given parameter
   */
  permissions(root, { module, action, userId, groupId, ...args }) {
    const filter = generateSelector({ module, action, userId, groupId });
    return paginate(Permissions.find(filter), args);
  },

  permissionModules() {
    const modules = [];

    for (let m of _.pairs(ModulesMap)) {
      modules.push({ name: m[0], description: m[1] });
    }

    return modules;
  },

  permissionActions() {
    const actions = [];

    for (let a of _.pairs(ActionsMap)) {
      actions.push({
        name: a[0],
        description: a[1].description,
        module: a[1].module,
      });
    }

    return actions;
  },

  /**
   * Get all permissions count. We will use it in pager
   * @param {String} args.module
   * @param {String} args.action
   * @param {String} args.userId
   * @return {Promise} total count
   */
  permissionsTotalCount(root, args) {
    const filter = generateSelector(args);
    return Permissions.find(filter).count();
  },
};

requireLogin(permissionQueries, 'permissionModules');
requireLogin(permissionQueries, 'permissionsTotalCount');
checkPermission(permissionQueries, 'permissions', 'showPermissionList');
checkPermission(permissionQueries, 'permissionActions', 'showPermissionActionList');

export default permissionQueries;
