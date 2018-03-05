import { Permissions } from '../../../db/models';
import { checkPermission, requireLogin } from '../../permissions';
import { ModulesMap, ActionsMap } from '../../permissions/utils';
import _ from 'underscore';
import { paginate } from './utils';

const generateSelector = ({ module, action, userId }) => {
  const filter = {};

  if (module) filter.module = module;

  if (action) filter.action = action;

  if (userId) filter.userId = userId;

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
  permissions(root, { module, action, userId, ...args }) {
    const filter = generateSelector({ module, action, userId });
    return paginate(Permissions.find(filter), args);
  },

  permissionModules() {
    const modules = [];

    for (let m of _.pairs(ModulesMap)) {
      modules.push({ name: m[0], description: m[1] });
    }

    return modules;
  },

  permissionActions(root, { moduleName }) {
    const actions = [];

    if (!moduleName) return actions;

    for (let a of _.pairs(ActionsMap)) {
      if (moduleName === a[1].module) {
        actions.push({
          name: a[0],
          description: a[1].description,
          module: a[1].module,
        });
      }
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
