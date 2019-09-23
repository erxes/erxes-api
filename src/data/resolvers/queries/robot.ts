import { RobotEntries } from '../../../db/models';
import { OnboardingHistories } from '../../../db/models/Robot';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const robotQueries = {
  robotEntries(_root) {
    return RobotEntries.find();
  },

  async onboardingActionsCompleteness(_root, { actions }: { actions: string[] }, { user }: IContext) {
    const result: { [key: string]: boolean } = {};

    for (const action of actions) {
      result[action] = (await OnboardingHistories.find({ userId: user._id, action }).countDocuments()) > 0;
    }

    return result;
  },

  onboardingGetAvailableFeatures(_root) {
    return [
      { name: 'inbox', text: 'Inbox' },
      { name: 'contacts', text: 'Contact' },
      { name: 'deals', text: 'Deals' },
      { name: 'tasks', text: 'Tasks' },
      { name: 'tickets', text: 'Tickets' },
      { name: 'growthHacks', text: 'Growth Hacks' },
      { name: 'engages', text: 'Engages' },
      { name: 'leads', text: 'Leads' },
      { name: 'knowledgebase', text: 'Knowledgebase' },
      { name: 'insights', text: 'Insights' },
      { name: 'imports', text: 'Imports' },
      { name: 'tags', text: 'Tags' },
      { name: 'segments', text: 'Segments' },
      { name: 'propertes', text: 'Properties' },
      { name: 'permissions', text: 'Permissions' },
      { name: 'integrations', text: 'Integrations' },
    ];
  },
};

moduleRequireLogin(robotQueries);

export default robotQueries;
