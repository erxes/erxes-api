import { Model, model } from 'mongoose';
import { ActivityLogs } from '.';
import { changeCompany, changeCustomer, updateOrder, watchItem } from './boardUtils';
import { IOrderInput } from './definitions/boards';
import { growthHackSchema, IGrowthHack, IGrowthHackDocument } from './definitions/growthHacks';

export interface IGrowthHackModel extends Model<IGrowthHackDocument> {
  getGrowthHack(_id: string): Promise<IGrowthHackDocument>;
  createGrowthHack(doc: IGrowthHack): Promise<IGrowthHackDocument>;
  updateGrowthHack(_id: string, doc: IGrowthHack): Promise<IGrowthHackDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<IGrowthHackDocument[]>;
  watchGrowthHack(_id: string, isAdd: boolean, userId: string): void;
  changeCustomer(newCustomerId: string, oldCustomerIds: string[]): Promise<IGrowthHackDocument>;
  changeCompany(newCompanyId: string, oldCompanyIds: string[]): Promise<IGrowthHackDocument>;
}

export const loadGrowthHackClass = () => {
  class GrowthHack {
    public static async getGrowthHack(_id: string) {
      const growthHack = await GrowthHacks.findOne({ _id });

      if (!growthHack) {
        throw new Error('GrowthHack not found');
      }

      return growthHack;
    }

    /**
     * Create a growthHack
     */
    public static async createGrowthHack(doc: IGrowthHack) {
      const growthHacksCount = await GrowthHacks.find({
        stageId: doc.stageId,
      }).countDocuments();

      const growthHack = await GrowthHacks.create({
        ...doc,
        order: growthHacksCount,
        modifiedAt: new Date(),
      });

      // create log
      await ActivityLogs.createGrowthHackLog(growthHack);

      return growthHack;
    }

    /**
     * Update GrowthHack
     */
    public static async updateGrowthHack(_id: string, doc: IGrowthHack) {
      await GrowthHacks.updateOne({ _id }, { $set: doc });

      return GrowthHacks.findOne({ _id });
    }

    /*
     * Update given growthHacks orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      return updateOrder(GrowthHacks, orders, stageId);
    }

    /**
     * Watch growthHack
     */
    public static async watchGrowthHack(_id: string, isAdd: boolean, userId: string) {
      return watchItem(GrowthHacks, _id, isAdd, userId);
    }

    /**
     * Change customer
     */
    public static async changeCustomer(newCustomerId: string, oldCustomerIds: string[]) {
      return changeCustomer(GrowthHacks, newCustomerId, oldCustomerIds);
    }

    /**
     * Change company
     */
    public static async changeCompany(newCompanyId: string, oldCompanyIds: string[]) {
      return changeCompany(GrowthHacks, newCompanyId, oldCompanyIds);
    }
  }

  growthHackSchema.loadClass(GrowthHack);

  return growthHackSchema;
};

loadGrowthHackClass();

// tslint:disable-next-line
const GrowthHacks = model<IGrowthHackDocument, IGrowthHackModel>('growthHacks', growthHackSchema);

export default GrowthHacks;
