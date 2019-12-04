export const EMAIL_CONTENT_CLASS = 'erxes-email-content';
export const EMAIL_CONTENT_PLACEHOLDER = `<div class="${EMAIL_CONTENT_CLASS}"></div>`;

export const INTEGRATION_KIND_CHOICES = {
  MESSENGER: 'messenger',
  LEAD: 'lead',
  FACEBOOK_MESSENGER: 'facebook-messenger',
  FACEBOOK_POST: 'facebook-post',
  GMAIL: 'gmail',
  CALLPRO: 'callpro',
  ALL: ['messenger', 'lead', 'facebook-messenger', 'facebook-post', 'gmail', 'callpro'],
};

export const MESSAGE_KINDS = {
  AUTO: 'auto',
  VISITOR_AUTO: 'visitorAuto',
  MANUAL: 'manual',
  ALL: ['auto', 'visitorAuto', 'manual'],
};

export const FORM_FIELDS = {
  TYPES: {
    INPUT: 'input',
    TEXT_AREA: 'textarea',
    RADIO: 'radio',
    CHECK: 'check',
    SELECT: 'select',
    DIVIDER: 'divider',
    EMAIL: 'email',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    ALL: ['input', 'textarea', 'radio', 'check', 'select', 'divider', 'email', 'firstName', 'lastName'],
  },
  VALIDATION: {
    BLANK: '',
    NUMBER: 'number',
    DATE: 'date',
    EMAIL: 'email',
    ALL: ['', 'number', 'date', 'email'],
  },
};

export const FIELD_CONTENT_TYPES = {
  FORM: 'form',
  CUSTOMER: 'customer',
  COMPANY: 'company',
  ALL: ['form', 'customer', 'company'],
};

export const COC_LEAD_STATUS_TYPES = [
  '',
  'new',
  'open',
  'inProgress',
  'openDeal',
  'unqualified',
  'attemptedToContact',
  'connected',
  'badTiming',
];

export const COC_LIFECYCLE_STATE_TYPES = [
  '',
  'subscriber',
  'lead',
  'marketingQualifiedLead',
  'salesQualifiedLead',
  'opportunity',
  'customer',
  'evangelist',
  'other',
];

export const FIELDS_GROUPS_CONTENT_TYPES = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
  PRODUCT: 'product',
  ALL: ['customer', 'company', 'product'],
};

export const CUSTOMER_BASIC_INFOS = [
  'firstName',
  'lastName',
  'primaryEmail',
  'primaryPhone',
  'ownerId',
  'position',
  'department',
  'leadStatus',
  'lifecycleState',
  'hasAuthority',
  'description',
  'doNotDisturb',
];

export const COMPANY_BASIC_INFOS = [
  'primaryName',
  'size',
  'industry',
  'website',
  'plan',
  'primaryEmail',
  'primaryPhone',
  'leadStatus',
  'lifecycleState',
  'businessType',
  'description',
  'doNotDisturb',
];

export const PRODUCT_BASIC_INFOS = ['name', 'categoryCode', 'type', 'description', 'sku', 'code', 'unitPrice'];

export const INSIGHT_BASIC_INFOS = {
  count: 'Customer count',
  messageCount: 'Conversation message count',
  customerCount: 'Conversations by customer count',
  customerCountPercentage: 'Customer Count Percentage',
  resolvedCount: 'Resolved conversation',
  averageResponseDuration: 'Average duration of total',
  firstResponseDuration: 'Average duration of first response',
  ALL: [
    'date',
    'count',
    'customerCount',
    'customerCountPercentage',
    'messageCount',
    'resolvedCount',
    'averageResponseDuration',
    'firstResponseDuration',
  ],
};

export const INSIGHT_TYPES = {
  DEAL: 'deal',
  CONVERSATION: 'conversation',
  ALL: ['deal', 'conversation'],
};

export const NOTIFICATION_MODULES = [
  {
    name: 'conversations',
    description: 'Conversations',
    types: [
      {
        name: 'conversationStateChange',
        text: 'State change',
      },
      {
        name: 'conversationAssigneeChange',
        text: 'Assignee change',
      },
      {
        name: 'conversationAddMessage',
        text: 'Add message',
      },
    ],
  },

  {
    name: 'channels',
    description: 'Channels',
    types: [
      {
        name: 'channelMembersChange',
        text: 'Members change',
      },
    ],
  },

  {
    name: 'deals',
    description: 'Deals',
    types: [
      {
        name: 'dealAdd',
        text: 'Assigned a new deal  card',
      },
      {
        name: 'dealRemoveAssign',
        text: 'Removed from the deal card',
      },
      {
        name: 'dealEdit',
        text: 'Deal card edited',
      },
      {
        name: 'dealChange',
        text: 'Moved between stages',
      },
      {
        name: 'dealDueDate',
        text: 'Due date is near',
      },
      {
        name: 'dealDelete',
        text: 'Deal card deleted',
      },
    ],
  },

  {
    name: 'tickets',
    description: 'Tickets',
    types: [
      {
        name: 'ticketAdd',
        text: 'Assigned a new ticket  card',
      },
      {
        name: 'ticketRemoveAssign',
        text: 'Removed from the ticket card',
      },
      {
        name: 'ticketEdit',
        text: 'Ticket card edited',
      },
      {
        name: 'ticketChange',
        text: 'Moved between stages',
      },
      {
        name: 'ticketDueDate',
        text: 'Due date is near',
      },
      {
        name: 'ticketDelete',
        text: 'Ticket card deleted',
      },
    ],
  },

  {
    name: 'tasks',
    description: 'Tasks',
    types: [
      {
        name: 'taskAdd',
        text: 'Assigned a new task  card',
      },
      {
        name: 'taskRemoveAssign',
        text: 'Removed from the task card',
      },
      {
        name: 'taskEdit',
        text: 'Task card edited',
      },
      {
        name: 'taskChange',
        text: 'Moved between stages',
      },
      {
        name: 'taskDueDate',
        text: 'Due date is near',
      },
      {
        name: 'taskDelete',
        text: 'Task card deleted',
      },
    ],
  },
  {
    name: 'customers',
    description: 'Customers',
    types: [
      {
        name: 'customerMention',
        text: 'Mention on customer note',
      },
    ],
  },
  {
    name: 'companies',
    description: 'Companies',
    types: [
      {
        name: 'companyMention',
        text: 'Mention on company note',
      },
    ],
  },
];

export const BOARD_BASIC_INFOS = [
  'userId',
  'createdAt',
  'order',
  'name',
  'closeDate',
  'reminderMinute',
  'isComplete',
  'description',
  'assignedUsers',
  'watchedUserIds',
  'labelIds',
  'stageId',
  'initialStageId',
  'modifiedAt',
  'modifiedBy',
  'priority',
];

export const USER_BASIC_INFOS = [
  'username',
  'isOwner',
  'email',
  'getNotificationByEmail',
  'isActive',
  'brandIds',
  'groupIds',
  'doNotDisturb',
];

export const BRAND_BASIC_INFOS = ['code', 'name', 'description', 'userId', 'createdAt'];

export const CHANNEL_BASIC_INFOS = [
  'createdAt',
  'name',
  'description',
  'conversationCount',
  'openConversationCount',
  'userId',
  'integrationIds',
  'memberIds',
];

export const PERMISSION_BASIC_INFOS = ['module', 'action', 'userId', 'groupId', 'requiredActions', 'allowed'];

export const MODULE_NAMES = {
  BRAND: 'brand',
  CHANNEL: 'channel',
  COMPANY: 'company',
  CUSTOMER: 'customer',
  DEAL: 'deal',
  TASK: 'task',
  TICKET: 'ticket',
  PERMISSION: 'permission',
  USER: 'user',
};
