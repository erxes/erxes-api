import conversation from './conversation';
import channel from './channel';
import brands from './brands';
import emailTemplate from './emailTemplate';
import responseTemplate from './responseTemplate';

export default {
  ...conversation,
  ...channel,
  ...brands,
  ...emailTemplate,
  ...responseTemplate,
};
