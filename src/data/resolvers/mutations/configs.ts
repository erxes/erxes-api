import { IContext } from '../../../connectionResolver';
import { IConfig } from '../../../db/models/definitions/configs';
import { moduleRequireLogin } from '../../permissions';

const configMutations = {
  /**
   * Create or update config object
   */
  configsInsert(_root, doc: IConfig, { models }: IContext) {
    const { Configs } = models;

    return Configs.createOrUpdateConfig(doc);
  },
};

moduleRequireLogin(configMutations);

export default configMutations;
