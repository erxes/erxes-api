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
};

moduleRequireLogin(robotQueries);

export default robotQueries;
