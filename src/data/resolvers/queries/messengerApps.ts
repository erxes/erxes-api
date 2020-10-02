import { MessengerApps } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IMessengerAppFilter {
  kind: string;
  integrationId: string;
}

const generateFilter = ({ kind, integrationId }: IMessengerAppFilter, commonQuerySelector) => {
  const query: any = commonQuerySelector;

  if (kind) {
    query.kind = kind;
  }

  if (integrationId) {
    query['credentials.integrationId'] = integrationId;
  }

  return query;
};

const messengerAppQueries = {
  /*
   * MessengerApps list
   */
  messengerApps(_root, args: IMessengerAppFilter, { commonQuerySelector }: IContext) {
    const query = generateFilter(args, commonQuerySelector);

    return MessengerApps.find(query);
  },

  /*
   * MessengerApps count
   */
  messengerAppsCount(_root, args: IMessengerAppFilter, { commonQuerySelector }: IContext) {
    const query = generateFilter(args, commonQuerySelector);

    return MessengerApps.find(query).countDocuments();
  },
};

moduleRequireLogin(messengerAppQueries);

export default messengerAppQueries;
