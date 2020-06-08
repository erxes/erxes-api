export const CONVERSATION_STATUSES = {
  NEW: 'new',
  OPEN: 'open',
  CLOSED: 'closed',
  ALL: ['new', 'open', 'closed'],
};

export const TAG_TYPES = {
  CONVERSATION: 'conversation',
  CUSTOMER: 'customer',
  ENGAGE_MESSAGE: 'engageMessage',
  COMPANY: 'company',
  INTEGRATION: 'integration',
  PRODUCT: 'product',
  ALL: ['conversation', 'customer', 'engageMessage', 'company', 'integration', 'product'],
};

export const MESSENGER_KINDS = {
  CHAT: 'chat',
  NOTE: 'note',
  POST: 'post',
  ALL: ['chat', 'note', 'post'],
};

export const SENT_AS_CHOICES = {
  BADGE: 'badge',
  SNIPPET: 'snippet',
  FULL_MESSAGE: 'fullMessage',
  ALL: ['badge', 'snippet', 'fullMessage'],
};

export const METHODS = {
  MESSENGER: 'messenger',
  EMAIL: 'email',
  ALL: ['messenger', 'email'],
};

export const LEAD_LOAD_TYPES = {
  SHOUTBOX: 'shoutbox',
  POPUP: 'popup',
  EMBEDDED: 'embedded',
  DROPDOWN: 'dropdown',
  SLIDEINLEFT: 'slideInLeft',
  SLIDEINRIGHT: 'slideInRight',
  ALL: ['', 'shoutbox', 'popup', 'embedded', 'dropdown', 'slideInLeft', 'slideInRight'],
};

export const LEAD_SUCCESS_ACTIONS = {
  EMAIL: 'email',
  REDIRECT: 'redirect',
  ONPAGE: 'onPage',
  ALL: ['', 'email', 'redirect', 'onPage'],
};

export const KIND_CHOICES = {
  MESSENGER: 'messenger',
  LEAD: 'lead',
  FACEBOOK_MESSENGER: 'facebook-messenger',
  FACEBOOK_POST: 'facebook-post',
  GMAIL: 'gmail',
  NYLAS_GMAIL: 'nylas-gmail',
  NYLAS_IMAP: 'nylas-imap',
  NYLAS_OFFICE365: 'nylas-office365',
  NYLAS_EXCHANGE: 'nylas-exchange',
  NYLAS_OUTLOOK: 'nylas-outlook',
  NYLAS_YAHOO: 'nylas-yahoo',
  CALLPRO: 'callpro',
  TWITTER_DM: 'twitter-dm',
  CHATFUEL: 'chatfuel',
  SMOOCH_VIBER: 'smooch-viber',
  SMOOCH_LINE: 'smooch-line',
  SMOOCH_TELEGRAM: 'smooch-telegram',
  SMOOCH_TWILIO: 'smooch-twilio',
  WHATSAPP: 'whatsapp',
  ALL: [
    'messenger',
    'lead',
    'facebook-messenger',
    'facebook-post',
    'gmail',
    'callpro',
    'chatfuel',
    'nylas-gmail',
    'nylas-imap',
    'nylas-office365',
    'nylas-outlook',
    'nylas-exchange',
    'nylas-yahoo',
    'twitter-dm',
    'smooch-viber',
    'smooch-line',
    'smooch-telegram',
    'smooch-twilio',
    'whatsapp',
  ],
};

export const INTEGRATION_NAMES_MAP = {
  messenger: 'Web messenger',
  lead: 'Lead',
  'facebook-messenger': 'Facebook messenger',
  'facebook-post': 'Facebook post',
  gmail: 'Gmail',
  callpro: 'Call pro',
  chatfuel: 'Chatfuel',
  'nylas-gmail': 'Gmail',
  'nylas-imap': 'Imap',
  'nylas-exchange': 'exchange',
  'nylas-office365': 'Office 365',
  'nylas-outlook': 'Outook',
  'nylas-yahoo': 'Yahoo',
  'twitter-dm': 'Twitter dm',
  'smooch-viber': 'Viber',
  'smooch-line': 'Line',
  'smooch-telegram': 'Telegram',
  'smooch-twilio': 'Twilio SMS',
  whatsapp: 'WhatsApp',
};

// messenger data availability constants
export const MESSENGER_DATA_AVAILABILITY = {
  MANUAL: 'manual',
  AUTO: 'auto',
  ALL: ['manual', 'auto'],
};

export const ACTIVITY_CONTENT_TYPES = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
  USER: 'user',
  DEAL: 'deal',
  TICKET: 'ticket',
  TASK: 'task',
  PRODUCT: 'product',
  GROWTH_HACK: 'growthHack',

  ALL: ['customer', 'company', 'user', 'deal', 'ticket', 'task', 'product', 'growthHack'],
};

export const PUBLISH_STATUSES = {
  DRAFT: 'draft',
  PUBLISH: 'publish',
  ALL: ['draft', 'publish'],
};

export const ACTIVITY_TYPES = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
  INTERNAL_NOTE: 'internal_note',
  CHECKLIST: 'checklist',
  CONVERSATION: 'conversation',
  SEGMENT: 'segment',
  DEAL: 'deal',
  EMAIL: 'email',
  TICKET: 'ticket',
  TASK: 'task',
  BRAND: 'brand',
  GROWTH_HACK: 'growthHack',

  ALL: [
    'customer',
    'company',
    'internal_note',
    'checklist',
    'conversation',
    'segment',
    'deal',
    'email',
    'ticket',
    'task',
    'brand',
    'growthHack',
  ],
};

export const ACTIVITY_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MERGE: 'merge',
  SEND: 'send',
  MOVED: 'moved',
  CONVERT: 'convert',
  ASSIGNEE: 'assignee',

  ALL: ['create', 'update', 'delete', 'merge', 'send', 'moved', 'convert', 'assignee'],
};

export const ACTIVITY_PERFORMER_TYPES = {
  SYSTEM: 'SYSTEM',
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  DEAL: 'DEAL',

  ALL: ['SYSTEM', 'USER', 'CUSTOMER', 'DEAL'],
};

export const PRODUCT_TYPES = {
  PRODUCT: 'product',
  SERVICE: 'service',
  ALL: ['product', 'service'],
};

export const PIPELINE_VISIBLITIES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  ALL: ['public', 'private'],
};

export const HACK_SCORING_TYPES = {
  RICE: 'rice',
  ICE: 'ice',
  PIE: 'pie',
  ALL: ['rice', 'ice', 'pie'],
};

export const FIELDS_GROUPS_CONTENT_TYPES = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
  PRODUCT: 'product',
  ALL: ['customer', 'company', 'product'],
};

export const CUSTOMER_LIFECYCLE_STATE_TYPES = [
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

export const COMPANY_LIFECYCLE_STATE_TYPES = [
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

export const COMPANY_BUSINESS_TYPES = [
  '',
  'Analyst',
  'Competitor',
  'Customer',
  'Integrator',
  'Investor',
  'Partner',
  'Press',
  'Prospect',
  'Reseller',
  'Other',
];

export const COMPANY_INDUSTRY_TYPES = [
  '',
  'Advertising/Public Relations',
  'Aerospace, Defense Contractors',
  'Agriculture',
  'Airlines',
  'Alcoholic Beverages',
  'Alternative Energy Production & Services',
  'Architectural Services',
  'Attorneys/Law Firms',
  'Automotive',
  'Banks',
  'Bars & Restaurants',
  'Books, Magazines & Newspapers',
  'Builders/General Contractors',
  'Business Services',
  'Car Manufacturers',
  'Coal Mining',
  'Colleges, Universities & Schools',
  'Commercial TV & Radio Stations',
  'Computer Software',
  'Construction',
  'Dairy',
  'Doctors & Other Health Professionals',
  'Education',
  'Energy & Natural Resources',
  'Finance, Insurance & Real Estate',
  'Food & Beverage',
  'Foundations, Philanthropists & Non-Profits',
  'Government Organization',
  'Health',
  'Hotels, Motels & Tourism',
  'Insurance',
  'Internet',
  'Lawyers / Law Firms',
  'Meat processing & products',
  'Medical Supplies',
  'Mining',
  'Mortgage Bankers & Brokers',
  'Music Production',
  'Natural Gas Pipelines',
  'Nursing Homes/Hospitals',
  'Phone Companies',
  'Postal Unions',
  'Printing & Publishing',
  'Private Equity & Investment Firms',
  'Publishing & Printing',
  'Real Estate',
  'Retail Sales',
  'Schools/Education',
  'Sports, Professional',
  'Telecom Services & Equipment',
  'Textiles',
  'Tobacco',
  'Transportation',
  'TV / Movies / Music',
];

export const PROBABILITY = {
  TEN: '10%',
  TWENTY: '20%',
  THIRTY: '30%',
  FOURTY: '40%',
  FIFTY: '50%',
  SIXTY: '60%',
  SEVENTY: '70%',
  EIGHTY: '80%',
  NINETY: '90%',
  WON: 'Won',
  LOST: 'Lost',
  DONE: 'Done',
  RESOLVED: 'Resolved',
  ALL: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', 'Won', 'Lost', 'Done', 'Resolved'],
};

export const BOARD_STATUSES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  ALL: ['active', 'archived'],
};

export const BOARD_TYPES = {
  DEAL: 'deal',
  TICKET: 'ticket',
  TASK: 'task',
  GROWTH_HACK: 'growthHack',
  ALL: ['deal', 'ticket', 'task', 'growthHack'],
};

export const MESSAGE_TYPES = {
  VIDEO_CALL: 'videoCall',
  VIDEO_CALL_REQUEST: 'videoCallRequest',
  TEXT: 'text',
  ALL: ['videoCall', 'videoCallRequest', 'text'],
};

// module constants
export const NOTIFICATION_TYPES = {
  CHANNEL_MEMBERS_CHANGE: 'channelMembersChange',
  CONVERSATION_ADD_MESSAGE: 'conversationAddMessage',
  CONVERSATION_ASSIGNEE_CHANGE: 'conversationAssigneeChange',
  CONVERSATION_STATE_CHANGE: 'conversationStateChange',
  DEAL_ADD: 'dealAdd',
  DEAL_REMOVE_ASSIGN: 'dealRemoveAssign',
  DEAL_EDIT: 'dealEdit',
  DEAL_CHANGE: 'dealChange',
  DEAL_DUE_DATE: 'dealDueDate',
  DEAL_DELETE: 'dealDelete',
  GROWTHHACK_ADD: 'growthHackAdd',
  GROWTHHACK_REMOVE_ASSIGN: 'growthHackRemoveAssign',
  GROWTHHACK_EDIT: 'growthHackEdit',
  GROWTHHACK_CHANGE: 'growthHackChange',
  GROWTHHACK_DUE_DATE: 'growthHackDueDate',
  GROWTHHACK_DELETE: 'growthHackDelete',
  TICKET_ADD: 'ticketAdd',
  TICKET_REMOVE_ASSIGN: 'ticketRemoveAssign',
  TICKET_EDIT: 'ticketEdit',
  TICKET_CHANGE: 'ticketChange',
  TICKET_DUE_DATE: 'ticketDueDate',
  TICKET_DELETE: 'ticketDelete',
  TASK_ADD: 'taskAdd',
  TASK_REMOVE_ASSIGN: 'taskRemoveAssign',
  TASK_EDIT: 'taskEdit',
  TASK_CHANGE: 'taskChange',
  TASK_DUE_DATE: 'taskDueDate',
  TASK_DELETE: 'taskDelete',
  CUSTOMER_MENTION: 'customerMention',
  COMPANY_MENTION: 'companyMention',
  ALL: [
    'channelMembersChange',
    'conversationAddMessage',
    'conversationAssigneeChange',
    'conversationStateChange',
    'dealAdd',
    'dealRemoveAssign',
    'dealEdit',
    'dealChange',
    'dealDueDate',
    'dealDelete',
    'growthHackAdd',
    'growthHackRemoveAssign',
    'growthHackEdit',
    'growthHackChange',
    'growthHackDueDate',
    'growthHackDelete',
    'ticketAdd',
    'ticketRemoveAssign',
    'ticketEdit',
    'ticketChange',
    'ticketDueDate',
    'ticketDelete',
    'taskAdd',
    'taskRemoveAssign',
    'taskEdit',
    'taskChange',
    'taskDueDate',
    'taskDelete',
    'customerMention',
    'companyMention',
  ],
};

export const FORM_TYPES = {
  LEAD: 'lead',
  GROWTH_HACK: 'growthHack',
  ALL: ['lead', 'growthHack'],
};

export const NOTIFICATION_CONTENT_TYPES = {
  TASK: 'task',
  DEAL: 'deal',
  COMPANY: 'company',
  CUSTOMER: 'customer',
  TICKET: 'ticket',
  CHANNEL: 'channel',
  CONVERSATION: 'conversation',
  ALL: ['task', 'deal', 'company', 'customer', 'ticket', 'channel', 'conversation'],
};

const STATUSES = [
  { label: 'Active', value: 'Active' },
  { label: 'Deleted', value: 'Deleted' },
];

export const COMPANY_SELECT_OPTIONS = {
  BUSINESS_TYPES: [
    { label: 'Competitor', value: 'Competitor' },
    { label: 'Customer', value: 'Customer' },
    { label: 'Investor', value: 'Investor' },
    { label: 'Partner', value: 'Partner' },
    { label: 'Press', value: 'Press' },
    { label: 'Prospect', value: 'Prospect' },
    { label: 'Reseller', value: 'Reseller' },
    { label: 'Other', value: 'Other' },
    { label: 'Unknown', value: '' },
  ],
  STATUSES,
  DO_NOT_DISTURB: [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'Unknown', value: '' },
  ],
};

export const CUSTOMER_SELECT_OPTIONS = {
  SEX: [
    { label: 'Not known', value: 0 },
    { label: 'Male', value: 1 },
    { label: 'Female', value: 2 },
    { label: 'Not applicable', value: 9 },
  ],
  EMAIL_VALIDATION_STATUSES: [
    { label: 'Valid', value: 'valid' },
    { label: 'Invalid', value: 'invalid' },
    { label: 'Accept all unverifiable', value: 'accept_all_unverifiable' },
    { label: 'Unverifiable', value: 'unverifiable' },
    { label: 'Unknown', value: 'unknown' },
    { label: 'Disposable', value: 'disposable' },
    { label: 'Catch all', value: 'catchall' },
    { label: 'Bad syntax', value: 'badsyntax' },
  ],
  PHONE_VALIDATION_STATUSES: [
    { label: 'Valid', value: 'valid' },
    { label: 'Invalid', value: 'invalid' },
    { label: 'Unknown', value: 'unknown' },
    { label: 'Can receive sms', value: 'receives_sms' },
    { label: 'Unverifiable', value: 'unverifiable' },
  ],
  LEAD_STATUS_TYPES: [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'attemptedToContact' },
    { label: 'Working', value: 'inProgress' },
    { label: 'Bad Timing', value: 'badTiming' },
    { label: 'Unqualified', value: 'unqualified' },
    { label: 'Unknown', value: '' },
  ],
  STATUSES,
  DO_NOT_DISTURB: [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'Unknown', value: '' },
  ],
  HAS_AUTHORITY: [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'Unknown', value: '' },
  ],
  STATE: [
    { label: 'Visitor', value: 'visitor' },
    { label: 'Lead', value: 'lead' },
    { label: 'Customer', value: 'customer' },
  ],
};

export const SEGMENT_STRING_OPERATORS = ['e', 'dne', 'c', 'dnc'];
export const SEGMENT_BOOLEAN_OPERATORS = ['is', 'ins', 'it', 'if'];
export const SEGMENT_NUMBER_OPERATORS = ['numbere', 'numberdne', 'numberigt', 'numberilt'];
export const SEGMENT_DATE_OPERATORS = ['dateigt', 'dateilt', 'wobm', 'woam', 'wobd', 'woad', 'drlt', 'drgt'];
