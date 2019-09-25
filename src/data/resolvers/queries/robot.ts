import { RobotEntries } from '../../../db/models';
import { OnboardingHistories } from '../../../db/models/Robot';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface IAction {
  name: string;
  url: string;
}

interface IFeature {
  name: string;
  text: string;
  description?: string;
  videoUrl?: string;
  actions?: IAction[];
}

const FEATURES: IFeature[] = [
  {
    name: 'inbox',
    text: 'Inbox',
    description: 'Inbox description',
    videoUrl: '',
    actions: [
      { name: 'brandCreate', url: '/settings/brands' },
      { name: 'channelCreate', url: '/settings/channels' },
      { name: 'integrationCreate', url: '/settings/integrations' },
    ],
  },

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

const robotQueries = {
  robotEntries(_root) {
    return RobotEntries.find();
  },

  onboardingActionsCompleteness(_root, { actions }: { actions: string[] }, { user }: IContext) {
    return OnboardingHistories.actionsCompletness(actions, user);
  },

  async onboardingGetAvailableFeatures(_root, _args, { user }: IContext) {
    const results: Array<{ feature: IFeature; isComplete: boolean }> = [];

    for (const feature of FEATURES) {
      const selector = { userId: user._id, completedActions: { $all: (feature.actions || []).map(a => a.name) } };

      results.push({
        feature,
        isComplete: (await OnboardingHistories.find(selector).countDocuments()) > 0,
      });
    }

    return results;
  },
};

moduleRequireLogin(robotQueries);

export default robotQueries;
