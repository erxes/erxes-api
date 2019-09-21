import { Brands, Channels, Integrations, RobotEntries } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const robotQueries = {
  robotEntries(_root) {
    return RobotEntries.find();
  },

  async robotSettingsCompleteness(_root, { settingNames }: { settingNames: string[] }) {
    const result: { [key: string]: boolean } = {};

    for (const settingName of settingNames) {
      switch (settingName) {
        case 'brands': {
          result.brands = Boolean(await Brands.find().count());
        }

        case 'channels': {
          result.channels = Boolean(await Channels.find().count());
        }

        case 'integrations': {
          result.integrations = Boolean(await Integrations.find().count());
        }
      }
    }

    return result;
  },

  robotOnboardingGetAvailableFeatures(_root) {
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
