export const moduleObj = {
  name: 'usersGroup',
  description: 'Users groups',
  actions: [
    {
      name: 'showUserGroupList',
      description: 'Show user group list',
      use: [],
    },
    {
      name: 'addUserGroups',
      description: 'Add user group',
      use: ['editUserGroups', 'removeUserGroups'],
    },
    {
      name: 'editUserGroups',
      description: 'Edit user group',
      use: [],
    },
    {
      name: 'removeUserGroups',
      description: 'Remove user group',
      use: [],
    },
  ],
};
