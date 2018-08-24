import * as mongoose from 'mongoose';
import { field } from './utils';
import { Customers, Companies } from './';
/*
 * Xls import history
 */
const ImportHistorySchema = mongoose.Schema({
  _id: field({ pkey: true }),
  success: field({ type: Number }),
  failed: field({ type: Number }),
  total: field({ type: Number }),
  ids: field({ type: [String] }),
  contentType: field({ type: String }),
  userId: field({ type: String }),
  date: field({ type: Date }),
});

class ImportHistory {
  /** Create new history
   *
   * @param {Number} success - Successfully imported customers
   * @param {Number} failed - Failed counts
   * @param {Number} total - Total customers in xls file
   * @param {String} contentType - Coc type
   * @param {String[]} ids - Imported coc ids
   *
   * @return {Promise} newly created history object
   */
  static async createHistory(doc, user) {
    return this.create({
      userId: user._id,
      date: new Date(),
      ...doc,
    });
  }

  /**
   * Remove Imported history
   * @param {String} _id - history id to remove
   *
   * @return {Promise}
   */
  static async removeHistory(_id) {
    const historyObj = await this.findOne({ _id });

    const { ids = [], contentType } = historyObj;

    let removeMethod = Customers.removeCustomer;

    if (contentType === 'company') {
      removeMethod = Companies.removeCompany;
    }

    for (let id of ids) {
      await removeMethod(id);
    }

    await this.remove({ _id });

    return _id;
  }
}

ImportHistorySchema.loadClass(ImportHistory);

const ImportHistories = mongoose.model('import_history', ImportHistorySchema);

export default ImportHistories;
