export const moduleObjects = {
  brands: {
    name: 'brands',
    description: 'Brands permission config',
    actions: [
      {
        name: 'manageBrands',
        description: 'Manage brands',
        use: ['showBrands'],
      },
      {
        name: 'showBrands',
        description: 'Show brands',
      },
    ],
  },
  channels: {
    name: 'channels',
    description: 'Channels permission config',
    actions: [
      {
        name: 'manageChannels',
        description: 'Manage channels',
        use: ['showChannels'],
      },
      {
        name: 'showChannels',
        description: 'Show channel',
      },
    ],
  },
  companies: {
    name: 'companies',
    description: 'Companies permission config',
    actions: [
      {
        name: 'manageCompanies',
        description: 'Manage companies',
        use: [
          'companiesAdd',
          'companiesEdit',
          'companiesEditCustomers',
          'companiesRemove',
          'companiesMerge',
          'showCompanies',
          'showCompaniesMain',
          'exportCompanies',
        ],
      },
      {
        name: 'companiesAdd',
        description: 'Add companies',
      },
      {
        name: 'companiesEdit',
        description: 'Edit companies',
      },
      {
        name: 'companiesRemove',
        description: 'Remove companies',
      },
      {
        name: 'companiesEditCustomers',
        description: 'Edit companies customer',
      },
      {
        name: 'companiesMerge',
        description: 'Merge companies',
      },
      {
        name: 'showCompanies',
        description: 'Show companies',
      },
      {
        name: 'showCompaniesMain',
        description: 'Show companies main',
      },
      {
        name: 'exportCompanies',
        description: 'Export companies to xls file',
      },
    ],
  },
  customers: {
    name: 'customers',
    description: 'Customers permission config',
    actions: [
      {
        name: 'manageCustomers',
        description: 'Manage customers',
        use: [
          'showCustomers',
          'customersAdd',
          'customersEdit',
          'updateCustomersCompanies',
          'customersMerge',
          'customersRemove',
          'exportCustomers',
        ],
      },
      {
        name: 'exportCustomers',
        description: 'Export customers',
      },
      {
        name: 'showCustomers',
        description: 'Show customers',
      },
      {
        name: 'customersAdd',
        description: 'Add customer',
      },
      {
        name: 'customersEdit',
        description: 'Edit customer',
      },
      {
        name: 'updateCustomersCompanies',
        description: 'Update customers companies',
      },
      {
        name: 'customersMerge',
        description: 'Merge customers',
      },
      {
        name: 'customersRemove',
        description: 'Remove customers',
      },
    ],
  },
  deals: {
    name: 'deals',
    description: 'Deals permission config',
    actions: [
      {
        name: 'manageDeals',
        description: 'Manage deals',
        use: [
          'showDeals',
          'dealBoardsAdd',
          'dealBoardsEdit',
          'dealBoardsRemove',
          'dealPipelinesAdd',
          'dealPipelinesEdit',
          'dealPipelinesUpdateOrder',
          'dealPipelinesRemove',
          'dealStagesAdd',
          'dealStagesEdit',
          'dealStagesChange',
          'dealStagesUpdateOrder',
          'dealStagesRemove',
          'dealsAdd',
          'dealsEdit',
          'dealsRemove',
        ],
      },
      {
        name: 'showDeals',
        description: 'Show deals',
      },
      {
        name: 'dealBoardsAdd',
        description: 'Add deal board',
      },
      {
        name: 'dealBoardsRemove',
        description: 'Remove deal board',
      },
      {
        name: 'dealPipelinesAdd',
        description: 'Add deal pipeline',
      },
      {
        name: 'dealPipelinesEdit',
        description: 'Edit deal pipeline',
      },
      {
        name: 'dealPipelinesRemove',
        description: 'Remove deal pipeline',
      },
      {
        name: 'dealPipelinesUpdateOrder',
        description: 'Deal update pipeline order',
      },
      {
        name: 'dealStagesAdd',
        description: 'Add deal stage',
      },
      {
        name: 'dealStagesEdit',
        description: 'Edit deal stage',
      },
      {
        name: 'dealStagesChange',
        description: 'Change change deal',
      },
      {
        name: 'dealStagesUpdateOrder',
        description: 'Update deal stage order',
      },
      {
        name: 'dealStagesRemove',
        description: 'Remove deal stage',
      },
      {
        name: 'dealsAdd',
        description: 'Add deal',
      },
      {
        name: 'dealsEdit',
        description: 'Edit deal',
      },
      {
        name: 'dealsRemove',
        description: 'Remove deal',
      },
    ],
  },
  engages: {
    name: 'engages',
    description: 'Engages permission config',
    actions: [
      {
        name: 'manageEngages',
        description: 'Manage engages',
        use: [
          'engageMessageSetLiveManual',
          'engageMessageSetPause',
          'engageMessageSetLive',
          'showEngagesMessages',
          'engageMessageAdd',
          'engageMessageEdit',
          'engageMessageRemove',
        ],
      },
      {
        name: 'engageMessageSetLive',
        description: 'Set live engage message',
      },
      {
        name: 'engageMessageSetPause',
        description: 'Set pause engage message',
      },
      {
        name: 'engageMessageSetLiveManual',
        description: 'Set live engage message manual',
      },
      {
        name: 'engageMessageRemove',
        description: 'Remove engage message',
      },
      {
        name: 'engageMessageEdit',
        description: 'Edit engage message',
      },
      {
        name: 'engageMessageAdd',
        description: 'Add engage message',
      },
      {
        name: 'showEngagesMessages',
        description: 'Show engages messages list',
      },
    ],
  },
  insights: {
    name: 'insights',
    description: 'Insights permission config',
    actions: [
      {
        name: 'exportInsights',
        description: 'Manage insights',
        use: ['showInsights'],
      },
      {
        name: 'showInsights',
        description: 'Show insights',
      },
    ],
  },
  knowledgeBase: {
    name: 'knowledgeBase',
    description: 'KnowledgeBase permission config',
    actions: [
      {
        name: 'manageKnowledgeBase',
        description: 'Manage knowledge base',
        use: ['showKnowledgeBase'],
      },
      {
        name: 'showKnowledgeBase',
        description: 'Show knowledge base',
      },
    ],
  },
  permissions: {
    name: 'permissions',
    description: 'Permissions config',
    actions: [
      {
        name: 'managePermissions',
        description: 'Manage permissions',
        use: ['showPermissions', 'showPermissionModules', 'showPermissionActions'],
      },
      {
        name: 'showPermissions',
        description: 'Show permissions',
      },
      {
        name: 'showPermissionsModules',
        description: 'Show permissions modules',
      },
      {
        name: 'showPermissionsActions',
        description: 'Show permissions actions',
      },
    ],
  },
  usersGroups: {
    name: 'usersGroups',
    description: 'Users Groups permission config',
    actions: [
      {
        name: 'manageUsersGroups',
        description: 'Manage users groups',
        use: ['showUsersGroups'],
      },
      {
        name: 'showUsersGroups',
        description: 'Show users groups',
      },
    ],
  },
  scripts: {
    name: 'scripts',
    description: 'Scripts permission config',
    actions: [
      {
        name: 'manageScripts',
        description: 'Manage scripts',
        use: ['showScripts'],
      },
      {
        name: 'showScripts',
        description: 'Show scripts',
      },
    ],
  },
  products: {
    name: 'products',
    description: 'Products permission config',
    actions: [
      {
        name: 'manageProducts',
        description: 'Manage products',
        use: ['showProducts'],
      },
      {
        name: 'showProducts',
        description: 'Show products',
      },
    ],
  },
  users: {
    name: 'users',
    description: 'Users permission config',
    actions: [
      {
        name: 'manageUsers',
        description: 'Manage users',
        use: ['showUsers', 'usersEdit', 'usersInvite', 'usersSetActiveStatus'],
      },
      {
        name: 'usersSetActiveStatus',
        description: 'Set active/deactive user',
      },
      {
        name: 'usersEdit',
        description: 'Update user',
      },
      {
        name: 'usersInvite',
        description: 'Invite user',
      },
    ],
  },
  emailTemplates: {
    name: 'emailTemplates',
    description: 'Email template permission config',
    actions: [
      {
        name: 'manageEmailTemplate',
        description: 'Manage email template',
        use: ['showEmailTemplates'],
      },
      {
        name: 'showEmailTemplates',
        description: 'Show email templates',
      },
    ],
  },
  responseTemplates: {
    name: 'responseTemplates',
    description: 'Response templates permission config',
    actions: [
      {
        name: 'manageResponseTemplate',
        description: 'Manage response template',
        use: ['showResponseTemplates'],
      },
      {
        name: 'showResponseTemplates',
        description: 'Show response templates',
      },
    ],
  },
  importHistories: {
    name: 'importHistories',
    description: 'Import histories permission config',
    actions: [
      {
        name: 'manageImportHistories',
        description: 'Manage import histories',
        use: ['importHistories', 'removeImportHistories', 'importXlsFile'],
      },
      {
        name: 'importXlsFile',
        description: 'Import xls files',
      },
      {
        name: 'removeImportHistories',
        description: 'Remove import histories',
      },
      {
        name: 'importHistories',
        description: 'Show import histories',
      },
    ],
  },
  tags: {
    name: 'tags',
    description: 'Tags permission config',
    actions: [
      {
        name: 'manageTags',
        description: 'Manage tags',
        use: ['showTags'],
      },
      {
        name: 'showTags',
        description: 'Show tags',
      },
    ],
  },
  forms: {
    name: 'forms',
    description: 'Form permission config',
    actions: [
      {
        name: 'manageForms',
        description: 'Manage forms',
        use: ['showForms'],
      },
      {
        name: 'showForms',
        description: 'Show forms',
      },
    ],
  },
  segments: {
    name: 'segments',
    description: 'Segments permission config',
    actions: [
      {
        name: 'manageSegments',
        description: 'Manage segments',
        use: ['showSegments'],
      },
      {
        name: 'showSegments',
        description: 'Show segments list',
      },
    ],
  },
  integrations: {
    name: 'integrations',
    description: 'Integrations permission config',
    actions: [
      {
        name: 'manageIntegrations',
        description: 'Manage integrations',
        use: [
          'showIntegrations',
          'integrationsCreateMessengerIntegration',
          'integrationsEditMessengerIntegration',
          'integrationsSaveMessengerAppearanceData',
          'integrationsSaveMessengerConfigs',
          'integrationsCreateFormIntegration',
          'integrationsEditFormIntegration',
          'integrationsCreateTwitterIntegration',
          'integrationsCreateFacebookIntegration',
          'integrationsCreateGmailIntegration',
          'integrationsSendGmail',
          'integrationsRemove',
        ],
      },
      {
        name: 'showIntegrations',
        description: 'Show integrations',
      },
      {
        name: 'integrationsCreateMessengerIntegration',
        description: 'Create messenger integration',
      },
      {
        name: 'integrationsEditMessengerIntegration',
        description: 'Edit messenger integration',
      },
      {
        name: 'integrationsSaveMessengerAppearanceData',
        description: 'Save messenger appearance data',
      },
      {
        name: 'integrationsSaveMessengerConfigs',
        description: 'Save messenger config',
      },
      {
        name: 'integrationsCreateFormIntegration',
        description: 'Create form integration',
      },
      {
        name: 'integrationsEditFormIntegration',
        description: 'Edit form integration',
      },
      {
        name: 'integrationsCreateTwitterIntegration',
        description: 'Create twitter integration',
      },
      {
        name: 'integrationsCreateFacebookIntegration',
        description: 'Create facebook integration',
      },
      {
        name: 'integrationsCreateGmailIntegration',
        description: 'Create gmail integration',
      },
      {
        name: 'integrationsSendGmail',
        description: 'Send gmail',
      },
      {
        name: 'integrationsRemove',
        description: 'Remove integration',
      },
    ],
  },
  fields: {
    name: 'fields',
    description: 'Fields permission config',
    actions: [
      {
        name: 'manageFields',
        description: 'Manage fields',
        use: ['showFields'],
      },
      {
        name: 'showFields',
        description: 'Show fields',
      },
    ],
  },
  fieldsGroups: {
    name: 'fieldsGroups',
    description: 'Fields groups permission config',
    actions: [
      {
        name: 'manageFieldsGroups',
        description: 'Manage fields groups',
        use: ['showFieldsGroups'],
      },
      {
        name: 'showFieldsGroups',
        description: 'Show fields groups',
      },
    ],
  },
  accounts: {
    name: 'accounts',
    description: 'Accounts permission config',
    actions: [
      {
        name: 'manageAccounts',
        description: 'Manage accounts',
        use: ['showAccounts'],
      },
      {
        name: 'showAccounts',
        description: 'Show accounts',
      },
    ],
  },
  inbox: {
    name: 'inbox',
    description: 'Inbox permission config',
    actions: [
      {
        name: 'showConversations',
        description: 'Show conversations',
      },
      {
        name: 'changeConversationStatus',
        description: 'Change conversation status',
      },
      {
        name: 'assignConversation',
        description: 'Assign conversation',
      },
      {
        name: 'conversationMessageAdd',
        description: 'Add conversation message',
      },
    ],
  },
  generalSettings: {
    name: 'generalSettings',
    description: 'General settings permission config',
    actions: [
      {
        name: 'showGeneralSettings',
        description: 'Show general settings',
      },
      {
        name: 'configGeneralSettings',
        description: 'Config general settings',
      },
    ],
  },
  emailAppearance: {
    name: 'emailAppearance',
    description: 'Email appearance permission config',
    actions: [
      {
        name: 'showEmailappearance',
        description: 'Show email appearance',
      },
      {
        name: 'configEmailAppearance',
        description: 'Config email appearance',
      },
    ],
  },
  systemStatus: {
    name: 'systemStatus',
    description: 'System status',
    actions: [
      {
        name: 'showSystemStatus',
        description: 'Show system status',
      },
    ],
  },
};
