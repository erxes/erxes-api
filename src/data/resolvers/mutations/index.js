import conversation from './conversation';
import channel from './channel';
import brands from './brands';
import tags from './tags';
import emailTemplate from './emailTemplate';
import responseTemplate from './responseTemplate';

export default {
  ...conversation,
  ...channel,
  ...brands,
  ...tags,
  ...emailTemplate,
  ...responseTemplate,
};
