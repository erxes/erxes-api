export const moduleObj = {
  name: 'conversation',
  description: 'Conversations',
  actions: [
    {
      name: 'showConversationList',
      description: 'Show conversation list',
      use: ['showConversationDetail'],
    },
    {
      name: 'showConversationDetail',
      description: 'Show converstaion detail',
      use: [],
    },
  ],
};
