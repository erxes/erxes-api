export const moduleObjects = {
  brands: {
    name: 'brands',
    description: 'Brands permission config',
    actions: [
      {
        name: 'manageBrands',
        description: 'Manage brands',
        use: [
          'brandsAdd',
          'brandsEdit',
          'brandsRemove',
          'updateBrandsConfigEmail',
          'updateBrandIntegration',
          'showBrands',
          'showBrandDetail',
        ],
      },
      {
        name: 'brandsAdd',
        description: 'Add brand',
      },
      {
        name: 'brandsEdit',
        description: 'Edit brand',
      },
      {
        name: 'brandsRemove',
        description: 'Remove brand',
      },
      {
        name: 'updateBrandsConfigEmail',
        description: 'Update brand config email',
      },
      {
        name: 'updateBrandIntegration',
        description: 'Brands manager integrations',
      },
      {
        name: 'showBrands',
        description: 'Show brands',
      },
      {
        name: 'showBrandDetail',
        description: 'Show brand detail',
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
        use: ['channelsAdd', 'channelsEdit', 'channelsRemove', 'showChannels', 'showChannelDetail'],
      },
      {
        name: 'channelsAdd',
        description: 'Add channel',
      },
      {
        name: 'channelsEdit',
        description: 'Edit channel',
      },
      {
        name: 'channelsRemove',
        description: 'Remove channel',
      },
      {
        name: 'showChannels',
        description: 'Show channel',
      },
      {
        name: 'showChannelDetail',
        description: 'Show channel detail',
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
          'showCompanyDetail',
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
        name: 'showCompanyDetail',
        description: 'Show company detail',
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
          'showCustomerDetail',
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
        name: 'showCustomerDetil',
        description: 'Show customer detail',
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
          'showDealDetail',
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
        name: 'showDealDetail',
        description: 'Show deal detail',
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
          'showEngagesMessageDetail',
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
      {
        name: 'showEngagesMessageDetail',
        description: 'Show engages message detail',
      },
    ],
  },
  insights: {
    name: 'insights',
    description: 'Insights permission config',
    actions: [
      {
        name: 'manageInsights',
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
        use: [
          'knowledgeBaseTopicsAdd',
          'knowledgeBaseTopicsEdit',
          'knowledgeBaseTopicsRemove',
          'knowledgeBaseCategoriesAdd',
          'knowledgeBaseCategoriesEdit',
          'knowledgeBaseArticlesAdd',
          'knowledgeBaseArticlesEdit',
          'knowledgeBaseArticlesRemove',
          'showKnowledgeBase',
          'showKnowledgeBaseArticles',
          'showKnowledgeBaseArticleDetail',
        ],
      },
      {
        name: 'knowledgeBaseArticlesRemove',
        description: 'Remove knowledge base article ',
      },
      {
        name: 'knowledgeBaseArticlesEdit',
        description: 'Edit knowledge base article',
      },
      {
        name: 'knowledgeBaseArticlesAdd',
        description: 'Add knowledge base article',
      },
      {
        name: 'knowledgeBaseCategoriesAdd',
        description: 'Add knowledge base category',
      },
      {
        name: 'knowledgeBaseCategoriesEdit',
        description: 'Edit knowledge base category',
      },
      {
        name: 'knowledgeBaseTopicsAdd',
        description: 'Add knowledge base topic',
      },
      {
        name: 'knowledgeBaseTopicsEdit',
        description: 'Edit knowledge base topic',
      },
      {
        name: 'knowledgeBaseTopicsRemove',
        description: 'Remove knowledge base topic',
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
        use: [
          'showPermissions',
          'showPermissionModules',
          'showPermissionActions',
          'permissionsAdd',
          'permissionsRemove',
        ],
      },
      {
        name: 'permissionsRemove',
        description: 'Remove permission',
      },
      {
        name: 'permissionsAdd',
        description: 'Add permission',
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
        use: ['showUsersGroups', 'usersGroupsAdd', 'usersGroupsEdit', 'usersGroupsRemove'],
      },
      {
        name: 'showUsersGroups',
        description: 'Show users groups',
      },
      {
        name: 'usersGroupsAdd',
        description: 'Add user group',
      },
      {
        name: 'usersGroupsEdit',
        description: 'Edit user group',
      },
      {
        name: 'usersGroupsRemove',
        description: 'Remove user group',
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
        use: ['showScripts', 'scriptsAdd', 'scriptsEdit', 'scriptsRemove'],
      },
      {
        name: 'scriptsRemove',
        description: 'Remove scripts',
      },
      {
        name: 'scriptsEdit',
        description: 'Edit scripts',
      },
      {
        name: 'scriptsAdd',
        description: 'Add script',
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
        use: ['showProducts', 'productsAdd', 'productsEdit', 'productsRemove'],
      },
      {
        name: 'productsAdd',
        description: 'Add product',
      },
      {
        name: 'productsEdit',
        description: 'Edit product',
      },
      {
        name: 'productsRemove',
        description: 'Remove product',
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
        use: ['showUsers', 'showUserDetail', 'usersEdit', 'usersInvite'],
      },
      {
        name: 'usersEdit',
        description: 'Update user',
      },
      {
        name: 'usersInvite',
        description: 'Invite user',
      },
      {
        name: 'showUserDetail',
        description: 'Show user detail',
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
        use: ['emailTemplates', 'emailTemplatesAdd', 'emailTemplatesEdit', 'emailTemplatesRemove'],
      },
      {
        name: 'emailTemplatesRemove',
        description: 'Remove email template',
      },
      {
        name: 'emailTemplatesEdit',
        description: 'Edit email template',
      },
      {
        name: 'emailTemplatesAdd',
        description: 'Add email template',
      },
      {
        name: 'emailTemplates',
        description: 'Show email templates',
      },
    ],
  },
  responseTemplates: {
    name: 'responseTemplates',
    description: 'Resposne templates permission config',
    actions: [
      {
        name: 'manageResponseTemplate',
        description: 'Manage resposne template',
        use: ['showResponseTemplates', 'responseTemplatesAdd', 'responseTemplatesEdit', 'responseTemplatesRemove'],
      },
      {
        name: 'responseTemplatesRemove',
        description: 'Remove response template',
      },
      {
        name: 'responseTemplatesEdit',
        description: 'Edit response template',
      },
      {
        name: 'responseTemplatesAdd',
        description: 'Add response template',
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
        use: ['importHistories', 'removeImportHistories'],
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
        use: ['showTags', 'showTagDetail', 'addTag', 'editTag', 'removeTag'],
      },
      {
        name: 'showTags',
        description: 'Show tags',
      },
      {
        name: 'showTagDetail',
        description: 'Show tag detail',
      },
      {
        name: 'addTag',
        description: 'Add tag',
      },
      {
        name: 'editTag',
        description: 'Edit tag',
      },
      {
        name: 'removeTag',
        description: 'Remove tag',
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
        use: ['formsAdd', 'formsEdit', 'showForms', 'showFormDetail'],
      },
      {
        name: 'showForms',
        description: 'Show forms',
      },
      {
        name: 'showFormDetail',
        description: 'Show form detail',
      },
      {
        name: 'formsAdd',
        description: 'Add form',
      },
      {
        name: 'formsEdit',
        description: 'Edit form',
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
        use: ['showSegments', 'showSegmentDetail', 'segmentsAdd', 'segmentsEdit', 'segmentsRemove'],
      },
      {
        name: 'segmentsAdd',
        description: 'Add segment',
      },
      {
        name: 'segmentsEdit',
        description: 'Edit segment',
      },
      {
        name: 'segmentsRemove',
        description: 'Remove segment',
      },
      {
        name: 'showSegments',
        description: 'Show segments list',
      },
      {
        name: 'showSegmentDetail',
        description: 'Show segment detail',
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
          'integrationDetail',
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
        name: 'integrationDetail',
        description: 'Show integration detail',
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
        use: ['showFields', 'fieldsAdd', 'fieldsEdit', 'fieldsRemove', 'fieldsUpdateOrder', 'fieldsUpdateVisible'],
      },
      {
        name: 'fieldsUpdateVisible',
        description: 'Update fields visible',
      },
      {
        name: 'fieldsUpdateOrder',
        description: 'Update fields order',
      },
      {
        name: 'fieldsRemove',
        description: 'Remove fields',
      },
      {
        name: 'fieldsEdit',
        description: 'Edit fields',
      },
      {
        name: 'fieldsAdd',
        description: 'Add fields',
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
        use: [
          'showFieldsGroups',
          'fieldsGroupsAdd',
          'fieldsGroupsEdit',
          'fieldsGroupsRemove',
          'fieldsGroupsUpdateVisible',
        ],
      },
      {
        name: 'fieldsGroupsUpdateVisible',
        description: 'Update visible fields groups',
      },
      {
        name: 'fieldsGroupsRemove',
        description: 'Remove fields groups',
      },
      {
        name: 'fieldsGroupsEdit',
        description: 'Edit fields groups',
      },
      {
        name: 'fieldsGroupsAdd',
        description: 'Add fields groups',
      },
      {
        name: 'showFieldsGroups',
        description: 'Show fields groups',
      },
    ],
  },
};
