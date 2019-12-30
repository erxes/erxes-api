import { Configs } from '../../../db/models';
import { IConfig } from '../../../db/models/definitions/configs';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { registerOnboardHistory } from '../../utils';

const configMutations = {
  /**
   * Create or update config object
   */
  async configsInsert(_root, doc: IConfig, { user }: IContext) {
    const prevConfig = (await Configs.findOne({ code: doc.code })) || { value: [] };

    const config = await Configs.createOrUpdateConfig(doc);

    const updatedConfig = await Configs.getConfig(doc.code);

    if (
      ['dealUOM', 'dealCurrency'].includes(doc.code) &&
      prevConfig.value.toString() !== updatedConfig.value.toString()
    ) {
      registerOnboardHistory({ type: `configure.${doc.code}`, user });
    }

    return config;
  },
};

moduleCheckPermission(configMutations, 'manageGeneralSettings');

export default configMutations;
