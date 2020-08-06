import * as debug from 'debug';

export const debugBase = message => {
  debug('erxes-message-broker')(message);
};
