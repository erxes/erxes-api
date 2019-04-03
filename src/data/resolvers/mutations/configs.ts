import { Configs } from '../../../db/models';
import { IConfig } from '../../../db/models/definitions/configs';
import { checkPermission } from '../../permissions';

const configMutations = {
  /**
   * Create or update config object
   */
  configsInsert(_root, doc: IConfig) {
    return Configs.createOrUpdateConfig(doc);
  },
};

checkPermission(configMutations, 'configsInsert', 'configGeneralSettings');

export default configMutations;
