import { Model } from 'mongoose';
import { Companies, Customers } from '.';
import { IModels } from '../../connectionResolver';
import { IImportHistory, IImportHistoryDocument, importHistorySchema } from './definitions/importHistory';
import { IUserDocument } from './definitions/users';

export interface IImportHistoryModel extends Model<IImportHistoryDocument> {
  createHistory(doc: IImportHistory, user: IUserDocument): Promise<IImportHistoryDocument>;
  removeHistory(_id: string): Promise<string>;
}

export const loadClass = (models: IModels) => {
  class ImportHistory {
    /*
     * Create new history
     */
    public static async createHistory(doc: IImportHistory, user: IUserDocument) {
      return models.ImportHistory.create({
        userId: user._id,
        date: new Date(),
        ...doc,
      });
    }

    /*
     * Remove Imported history
     */
    public static async removeHistory(_id: string) {
      const historyObj = await models.ImportHistory.findOne({ _id });

      if (!historyObj) {
        throw new Error('Import history not found');
      }

      const { ids = [], contentType } = historyObj;

      let removeMethod = Customers.removeCustomer;

      if (contentType === 'company') {
        removeMethod = Companies.removeCompany;
      }

      for (const id of ids) {
        await removeMethod(id);
      }

      await models.ImportHistory.remove({ _id });

      return _id;
    }
  }

  importHistorySchema.loadClass(ImportHistory);

  return importHistorySchema;
};
