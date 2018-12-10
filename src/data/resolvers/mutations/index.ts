import accounts from './accounts';
import activityLogs from './activityLogs';
import brands from './brands';
import channels from './channels';
import companies from './companies';
import configs from './configs';
import conversations from './conversations';
import customers from './customers';
import deals from './deals';
import emailTemplates from './emailTemplates';
import engages from './engages';
import { fieldMutations as fields, fieldsGroupsMutations as fieldsgroups } from './fields';
import forms from './forms';
import importHistory from './importHistory';
import integrations from './integrations';
import internalNotes from './internalNotes';
import knowledgeBase from './knowledgeBase';
import messengerApps from './messengerApps';
import notifications from './notifications';
import products from './products';
import responseTemplates from './responseTemplates';
import segments from './segments';
import tags from './tags';
import users from './users';

export default {
  ...users,
  ...accounts,
  ...conversations,
  ...tags,
  ...engages,
  ...brands,
  ...internalNotes,
  ...customers,
  ...segments,
  ...companies,
  ...fields,
  ...emailTemplates,
  ...responseTemplates,
  ...channels,
  ...forms,
  ...integrations,
  ...notifications,
  ...knowledgeBase,
  ...activityLogs,
  ...deals,
  ...products,
  ...configs,
  ...fieldsgroups,
  ...importHistory,
  ...messengerApps,
};
