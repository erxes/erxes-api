import * as path from 'path';
import { ImportHistory } from '../../../db/models';
import { clearIntervals, createWorkers, removeWorkers, splitToCore } from '../../../workers/utils';
import { checkPermission } from '../../permissions';

const importHistoryMutations = {
  /**
   * Remove a history
   */
  async importHistoriesRemove(_root, { _id }: { _id: string }) {
    const importHistory = await ImportHistory.findOne({ _id });

    if (!importHistory) {
      throw new Error('History not found');
    }

    const ids: any = importHistory.ids || [];

    const results = splitToCore(ids);

    const workerFile =
      process.env.NODE_ENV === 'production'
        ? `./dist/workers/importHistoryRemove.worker.js`
        : './src/workers/importHistoryRemove.worker.import.js';

    const workerPath = path.resolve(workerFile);

    const workerData = {
      contentType: importHistory.contentType,
    };

    await createWorkers(workerPath, workerData, results);

    return ImportHistory.removeHistory(_id);
  },

  /**
   * Cancel uploading process
   */
  async importHistoriesCancel(_root, { _id }: { _id: string }) {
    const importHistory = await ImportHistory.findOne({ _id });

    if (!importHistory) {
      throw new Error('History not found');
    }

    clearIntervals();

    removeWorkers();

    return true;
  },
};

checkPermission(importHistoryMutations, 'importHistoriesRemove', 'removeImportHistories');

export default importHistoryMutations;
