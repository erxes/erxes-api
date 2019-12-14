import { ImportHistory } from '../../../db/models';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import utils, { putDeleteLog } from '../../utils';
import { gatherCompanyNames, gatherCustomerNames, gatherProductNames, gatherUsernames, LogDesc } from './logUtils';

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
          targetIds: JSON.stringify(importHistory.ids || []),
          contentType: importHistory.contentType,
          importHistoryId: importHistory._id,
        },
      });
    } catch (e) {
      throw new Error(e);
    }

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [importHistory.userId],
      foreignKey: 'userId',
    });

    const params = {
      idFields: importHistory.ids,
      foreignKey: 'ids',
      prevList: extraDesc,
    };

    switch (importHistory.contentType) {
      case MODULE_NAMES.COMPANY:
        extraDesc = await gatherCompanyNames(params);
        break;
      case MODULE_NAMES.CUSTOMER:
        extraDesc = await gatherCustomerNames(params);
        break;
      case MODULE_NAMES.PRODUCT:
        extraDesc = await gatherProductNames(params);
        break;
      default:
        break;
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.IMPORT_HISTORY,
        object: importHistory,
        description: `${importHistory._id}-${importHistory.date} has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

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
