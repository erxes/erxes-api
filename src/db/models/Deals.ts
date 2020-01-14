import { Model, model } from 'mongoose';
import { ActivityLogs, Companies, Conformities, Customers } from '.';
import { fillSearchTextItem, updateOrder, watchItem } from './boardUtils';
import { IOrderInput } from './definitions/boards';
import { ICompanyDocument } from './definitions/companies';
import { ICustomerDocument } from './definitions/customers';
import { dealSchema, IDeal, IDealDocument } from './definitions/deals';

export interface IDealModel extends Model<IDealDocument> {
  getDeal(_id: string): Promise<IDealDocument>;
  createDeal(doc: IDeal): Promise<IDealDocument>;
  updateDeal(_id: string, doc: IDeal): Promise<IDealDocument>;
  updateOrder(stageId: string, orders: IOrderInput[]): Promise<IDealDocument[]>;
  watchDeal(_id: string, isAdd: boolean, userId: string): void;
  getCustomers(_id: string): Promise<ICustomerDocument[]>;
  getCompanies(_id: string): Promise<ICompanyDocument[]>;
}

export const loadDealClass = () => {
  class Deal {
    public static async getDeal(_id: string) {
      const deal = await Deals.findOne({ _id });

      if (!deal) {
        throw new Error('Deal not found');
      }

      return deal;
    }

    /**
     * Create a deal
     */
    public static async createDeal(doc: IDeal) {
      if (doc.sourceConversationId) {
        const convertedDeal = await Deals.findOne({ sourceConversationId: doc.sourceConversationId });

        if (convertedDeal) {
          throw new Error('Already converted a deal');
        }
      }

      const dealsCount = await Deals.find({
        stageId: doc.stageId,
      }).countDocuments();

      const deal = await Deals.create({
        ...doc,
        order: dealsCount,
        createdAt: new Date(),
        modifiedAt: new Date(),
        searchText: fillSearchTextItem(doc),
      });

      // create log
      await ActivityLogs.createBoardItemLog({ item: deal, contentType: 'deal' });

      return deal;
    }

    /**
     * Update Deal
     */
    public static async updateDeal(_id: string, doc: IDeal) {
      const searchText = fillSearchTextItem(doc, await Deals.getDeal(_id));

      await Deals.updateOne({ _id }, { $set: doc, searchText });

      return Deals.findOne({ _id });
    }

    /*
     * Update given deals orders
     */
    public static async updateOrder(stageId: string, orders: IOrderInput[]) {
      return updateOrder(Deals, orders, stageId);
    }

    /**
     * Watch deal
     */
    public static watchDeal(_id: string, isAdd: boolean, userId: string) {
      return watchItem(Deals, _id, isAdd, userId);
    }

    public static async getCompanies(_id: string) {
      const conformities = await Conformities.find({ mainType: 'deal', mainTypeId: _id, relType: 'company' });

      const companyIds = conformities.map(c => c.relTypeId);

      return Companies.find({ _id: { $in: companyIds } });
    }

    public static async getCustomers(_id: string) {
      const conformities = await Conformities.find({ mainType: 'deal', mainTypeId: _id, relType: 'customer' });

      const customerIds = conformities.map(c => c.relTypeId);

      return Customers.find({ _id: { $in: customerIds } });
    }
  }

  dealSchema.loadClass(Deal);

  return dealSchema;
};

loadDealClass();

// tslint:disable-next-line
const Deals = model<IDealDocument, IDealModel>('deals', dealSchema);

export default Deals;
