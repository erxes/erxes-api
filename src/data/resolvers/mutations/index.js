import conversation from './conversation';
import channel from './channel';
import brands from './brands';
import tags from './tags';
import emailTemplate from './emailTemplate';
import responseTemplate from './responseTemplate';
import form from './form';

export default {
  ...conversation,
  ...channel,
  ...brands,
  ...tags,
  ...emailTemplate,
  ...responseTemplate,
  ...form,
};
