import { getEnv } from '../../utils';
import conversations from './conversations';
import customers from './customers';
import pubsub from './pubsub';

export { pubsub };

let subscriptions: any = {
  ...conversations,
  ...customers,
};

const NODE_ENV = getEnv({ name: 'NODE_ENV' });

// disable subscriptions in test mode
if (NODE_ENV === 'test') {
  subscriptions = {};
}

export default subscriptions;
