import { ImportHistory } from '../../../db/models';
import { checkPermission } from '../../permissions';
import { paginate } from './utils';

const importHistoryQueries = {
  /**
   * Import history list
   */
  importHistories(_root, { type, ...args }: { page: number; perPage: number; type: string }) {
    return paginate(ImportHistory.find({ contentType: type }), args);
  },

  async importHistoryDetail(_root, { _id }: { _id: string }) {
    const importHistory = await ImportHistory.findOne({ _id });

    if (!importHistory) {
      throw new Error('Import history not found');
    }

    importHistory.errorMsgs = (importHistory.errorMsgs || []).slice(0, 100);

    return importHistory;
  },
};

checkPermission(importHistoryQueries, 'importHistories', 'importHistories', []);

export default importHistoryQueries;
