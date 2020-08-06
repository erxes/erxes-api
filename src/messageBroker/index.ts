import * as coteClient from './cote';
import * as rabbitmqClient from './rabbitmq';

interface IOptions {
  name: string;
  RABBITMQ_HOST?: string;
  hasPublisher?: boolean;
  hasRequester?: boolean;
  hasSubscriber?: boolean;
}

const init = async (options: IOptions) => {
  if (options.RABBITMQ_HOST) {
    rabbitmqClient.init(options.RABBITMQ_HOST);

    return rabbitmqClient;
  } else {
    coteClient.init(options);

    return coteClient;
  }
};

export default init;
