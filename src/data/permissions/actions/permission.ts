export const moduleObj = {
  name: 'permissions',
  description: 'Permission config',
  actions: [
    {
      name: 'configPermission',
      description: 'Permission config',
      use: ['showPermissionActionList', 'showPermissionList'],
    },
    {
      name: 'showPermissionList',
      description: 'Show permission list',
      use: [],
    },
    {
      name: 'showPermissionActionList',
      description: 'Show permission action list',
    },
  ],
};
