import { Model, model } from 'mongoose';
import { ActivityLogs } from '.';
import { IOrderInput } from './definitions/boards';
import { dealSchema, IDeal, IDealDocument } from './definitions/deals';

export interface IDealModel extends Model<IDealDocument> {
  createDeal(doc: IDeal): Promise<IDealDocument>;
  updateDeal(_id: string, doc: IDeal): Promise<IDealDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<IDealDocument[]>;
  removeDeal(_id: string): void;
  changeCustomer(newCustomerId: string, oldCustomerIds: string[]): Promise<IDealDocument>;
  changeCompany(newCompanyId: string, oldCompanyIds: string[]): Promise<IDealDocument>;
}

export const loadDealClass = () => {
  class Deal {
    /**
     * Create a deal
     */
    public static async createDeal(doc: IDeal) {
      const dealsCount = await Deals.find({
        stageId: doc.stageId,
      }).countDocuments();

      const deal = await Deals.create({
        ...doc,
        order: dealsCount,
        modifiedAt: new Date(),
      });

      // create log
      await ActivityLogs.createDealLog(deal);

      return deal;
    }

    /**
     * Update Deal
     */
    public static async updateDeal(_id: string, doc: IDeal) {
      await Deals.updateOne({ _id }, { $set: doc });

      return Deals.findOne({ _id });
    }

    /*
     * Update given deals orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      const ids: string[] = [];
      const bulkOps: Array<{
        updateOne: {
          filter: { _id: string };
          update: { stageId: string; order: number };
        };
      }> = [];

      for (const { _id, order } of orders) {
        ids.push(_id);
        bulkOps.push({
          updateOne: {
            filter: { _id },
            update: { stageId, order },
          },
        });

        // update each deals order
      }

      if (bulkOps) {
        await Deals.bulkWrite(bulkOps);
      }

      return Deals.find({ _id: { $in: ids } }).sort({ order: 1 });
    }

    /**
     * Remove Deal
     */
    public static async removeDeal(_id: string) {
      const deal = await Deals.findOne({ _id });

      if (!deal) {
        throw new Error('Deal not found');
      }

      return deal.remove();
    }

    /**
     * Change customer
     */
    public static async changeCustomer(newCustomerId: string, oldCustomerIds: string[]) {
      if (oldCustomerIds) {
        await Deals.updateMany({ customerIds: { $in: oldCustomerIds } }, { $addToSet: { customerIds: newCustomerId } });
        await Deals.updateMany({ customerIds: { $in: oldCustomerIds } }, { $pullAll: { customerIds: oldCustomerIds } });
      }

      return Deals.find({ customerIds: { $in: oldCustomerIds } });
    }

    /**
     * Change company
     */
    public static async changeCompany(newCompanyId: string, oldCompanyIds: string[]) {
      if (oldCompanyIds) {
        await Deals.updateMany({ companyIds: { $in: oldCompanyIds } }, { $addToSet: { companyIds: newCompanyId } });

        await Deals.updateMany({ companyIds: { $in: oldCompanyIds } }, { $pullAll: { companyIds: oldCompanyIds } });
      }

      return Deals.find({ customerIds: { $in: oldCompanyIds } });
    }
  }

  dealSchema.loadClass(Deal);

  return dealSchema;
};

loadDealClass();

// tslint:disable-next-line
const Deals = model<IDealDocument, IDealModel>('deals', dealSchema);

export default Deals;
