import { ImportHistory } from '../../../db/models';
import { MODULE_NAMES } from '../../constants';
import { putDeleteLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils from '../../utils';

const importHistoryMutations = {
  /**
   * Removes a history
   * @param {string} param1._id ImportHistory id
   */
  async importHistoriesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const importHistory = await ImportHistory.getImportHistory(_id);

    await ImportHistory.updateOne({ _id: importHistory._id }, { $set: { status: 'Removing' } });

    try {
      await utils.fetchWorkersApi({
        path: '/import-remove',
        method: 'POST',
        body: {
          contentType: importHistory.contentType,
          importHistoryId: importHistory._id,
        },
      });
    } catch (e) {
      throw new Error(e);
    }

    await putDeleteLog({ type: MODULE_NAMES.IMPORT_HISTORY, object: importHistory }, user);

    return ImportHistory.findOne({ _id: importHistory._id });
  },

  /**
   * Cancel uploading process
   */
  async importHistoriesCancel(_root, { _id }: { _id: string }) {
    const importHistory = await ImportHistory.findOne({ _id });

    if (!importHistory) {
      throw new Error('History not found');
    }

    try {
      await utils.fetchWorkersApi({ path: '/import-cancel', method: 'POST' });
    } catch (e) {
      throw new Error(e);
    }

    return true;
  },
};

checkPermission(importHistoryMutations, 'importHistoriesRemove', 'removeImportHistories');

export default importHistoryMutations;
