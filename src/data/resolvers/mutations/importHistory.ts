import { IContext } from '../../../connectionResolver';
import { moduleRequireLogin } from '../../permissions';

const importHistoryMutations = {
  /**
   * Remove a history
   */
  importHistoriesRemove(_root, { _id }: { _id: string }, { models: { ImportHistory } }: IContext) {
    return ImportHistory.removeHistory(_id);
  },
};

moduleRequireLogin(importHistoryMutations);

export default importHistoryMutations;
