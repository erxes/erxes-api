export const moduleObj = {
  name: 'permissions',
  description: 'Permission config',
  actions: [
    {
      name: 'showPermissionList',
      description: 'Show permission list',
      use: ['showPermissionActionList'],
    },
    {
      name: 'showPermissionActionList',
      description: 'Show permission action list',
    },
    {
      name: 'configPermission',
      description: 'Permission config',
      use: ['showPermissionActionList'],
    },
  ],
};
