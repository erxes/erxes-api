import { Model, model } from 'mongoose';
import { Customers, Loyalties } from '.';
import { Stages } from './Boards';
import Conformities from './Conformities';
import { IItemDragCommonFields } from './definitions/boards';
import { PROBABILITY } from './definitions/constants';
import { ICustomerDocument } from './definitions/customers';
import { IDealDocument } from './definitions/deals';
import { loyaltySchema, ILoyaltyDocument } from './definitions/loyalties';
import { IUserDocument } from './definitions/users';

export interface ICompanyModel extends Model<ILoyaltyDocument> {
  getLoyalty(customer: ICustomerDocument): number;
  getOneLoyalty(_id: string): Promise<ILoyaltyDocument>;
  dealChangeCheckLoyalty(doc: IItemDragCommonFields, deal: IDealDocument): void;
  addLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument): void;
  minusLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument): void;
  updateLoyalty(_id: string, doc: ILoyaltyDocument, user: IUserDocument): Promise<ILoyaltyDocument>;
  deleteLoyalty(_id: string): void;
}

export const loadClass = () => {
  class Loyalty {
    public static async getLoyalty(customer: ICustomerDocument) {
      const response = await Loyalties.aggregate([
        { $match: { customerId: customer._id } },
        { $group: { _id: customer._id, sumLoyalty: { $sum: "$amount" } } }
      ]);

      if (!response.length) {
        return 0;
      }

      return response[0].sumLoyalty
    }

    public static async getOneLoyalty(_id: string) {
      const loyalty = await Loyalties.findOne({ _id });
      if (!loyalty) {
        throw new Error('Loyalty not found');
      }

      return loyalty;
    }

    public static addLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument) {
      if (amount <= 0) {
        return;
      }

      return Loyalties.create({
        customerId: customer._id,
        amount,
        modifiedAt: new Date(),
        userId: user?._id
      })
    }

    public static minusLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument) {
      if (amount === 0) {
        return;
      }

      const fixAmount = amount > 0 ? -1 * amount : amount;

      return Loyalties.create({
        customerId: customer._id,
        amount: fixAmount,
        modifiedAt: new Date(),
        userId: user?._id
      })
    }

    public static async CalcLoyalty(deal: IDealDocument) {
      const amounts = deal.productsData?.map(item => item.tickUsed ? item.amount : 0);
      const sumAmount = amounts?.reduce((pre, current) => {
        return pre || 0 + current || 0;
      }, 0) || 0;
      return sumAmount * 0.001;
    }

    public static async dealChangeCheckLoyalty(doc: IItemDragCommonFields, deal: IDealDocument, user?: IUserDocument) {
      const customerIds = await Conformities.savedConformity({ mainType: 'deal', mainTypeId: deal._id, relTypes: ['customer'] });
      if (!customerIds) {
        return;
      }

      const { destinationStageId, sourceStageId } = doc;

      const destinationStage = await Stages.getStage(destinationStageId);
      const sourceStage = await Stages.getStage(sourceStageId);

      if (destinationStage.probability === PROBABILITY.WON) {
        return Loyalties.addLoyalty(await Customers.getCustomer(customerIds[0]), await this.CalcLoyalty(deal), user);
      }

      if (sourceStage.probability === PROBABILITY.WON) {
        return Loyalties.minusLoyalty(await Customers.getCustomer(customerIds[0]), await this.CalcLoyalty(deal), user)
      }
    }

    public static updateLoyalty(_id: string, doc: ILoyaltyDocument) {
      return Loyalties.updateOne({ _id }, { $set: { ...doc } });
    }

    public static deleteLoyalty(_id: string) {
      return Loyalties.deleteOne({ _id });
    }
  }

  loyaltySchema.loadClass(Loyalty);

  return loyaltySchema;
};

loadClass();

// tslint:disable-next-line
const Companies = model<ILoyaltyDocument, ICompanyModel>('loyalties', loyaltySchema);

export default Companies;
