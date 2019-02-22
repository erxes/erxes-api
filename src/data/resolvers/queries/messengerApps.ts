import { MessengerApps } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions';

const messengerAppQueries = {
  /*
   * MessengerApps list
   */
  messengerApps(_root, { kind }: { kind: string }) {
    const query: any = {};

    if (kind) {
      query.kind = kind;
    }

    return MessengerApps.find(query);
  },

  /*
   * MessengerApps count
   */
  messengerAppsCount(_root, { kind }: { kind: string }) {
    const query: any = {};

    if (kind) {
      query.kind = kind;
    }

    return MessengerApps.find(query).countDocuments();
  },
};

moduleRequireLogin(messengerAppQueries);

export default messengerAppQueries;
