import { Model, model } from 'mongoose';
import { Customers, Loyalties } from '.';
import { getConfig } from '../../data/utils';
import { Stages } from './Boards';
import Conformities from './Conformities';
import { PROBABILITY } from './definitions/constants';
import { ICustomerDocument } from './definitions/customers';
import { IDealDocument } from './definitions/deals';
import { loyaltySchema, ILoyaltyDocument } from './definitions/loyalties';
import { IUserDocument } from './definitions/users';

export interface ICompanyModel extends Model<ILoyaltyDocument> {
  getLoyaltyValue(customer: ICustomerDocument, excludeDealId?: string): number;
  dealChangeCheckLoyalty(deal: IDealDocument, stageId: string, user?: IUserDocument): void;
  addLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument): void;
  minusLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument): void;
  deleteLoyaltyOfDeal(dealId: string): void;
  convertLoyaltyToCurrency(value: number)
}

export const loadClass = () => {
  class Loyalty {
    public static async getLoyaltyValue(customer: ICustomerDocument, excludeDealId?: string) {
      let match:any = { customerId: customer._id };

      if (excludeDealId) {
        match = { $and: [ { customerId: customer._id }, { dealId: { $ne: excludeDealId } } ] };
      }

      const response = await Loyalties.aggregate([
        { $match: match },
        { $group: { _id: customer._id, sumLoyalty: { $sum: "$value" } } }
      ]);

      if (!response.length) {
        return 0;
      }

      return response[0].sumLoyalty
    }

    static async getLoyaltyOfDeal(customer: ICustomerDocument, deal: IDealDocument) {
      return Loyalties.findOne({customerId: customer._id, dealId: deal._id})
    }

    public static async addLoyalty(customer: ICustomerDocument, value: number, user?: IUserDocument) {
      if (value <= 0) {
        return;
      }

      return Loyalties.create({
        customerId: customer._id,
        value,
        modifiedAt: new Date(),
        userId: user?._id
      })
    }

    public static async minusLoyalty(customer: ICustomerDocument, amount: number, user?: IUserDocument) {
      if (amount === 0) {
        return;
      }

      const fixAmount = amount > 0 ? -1 * amount : amount;

      return Loyalties.create({
        customerId: customer._id,
        value: fixAmount,
        modifiedAt: new Date(),
        userId: user?._id
      })
    }

    public static async CalcLoyalty(deal: IDealDocument) {
      const amounts = deal.productsData?.map(item => item.tickUsed ? item.amount || 0 : 0) || [];
      const sumAmount = amounts.reduce((preVal, currVal) => {
        return preVal + currVal
      })

      return this.convertCurrencyToLoyalty(sumAmount);
    }

    static async UseLoyalty(deal: IDealDocument) {
      const ratio = await getConfig('LOYALTY_RATIO_CURRENCY', 1);
      return (deal.paymentsData?.loyalty?.amount || 0) / ratio;
    }

    public static async convertLoyaltyToCurrency(value: number) {
      const ratio = await getConfig('LOYALTY_RATIO_CURRENCY', 1);
      return value * ratio;
    }

    static async convertCurrencyToLoyalty(currency: number) {
      const percent = await getConfig('LOYALTY_PERCENT_OF_DEAL', 0);
      return currency / 100 * percent;
    }

    public static async dealChangeCheckLoyalty(deal: IDealDocument, stageId: string, user?: IUserDocument) {
      const customerIds = await Conformities.savedConformity({ mainType: 'deal', mainTypeId: deal._id, relTypes: ['customer'] });
      if (!customerIds) {
        return;
      }

      const customers = await Customers.find({_id: { $in: customerIds}});
      const stage = await Stages.getStage(stageId);
      let valueForDeal = 0;
      let valueForUse = 0;
      if (stage.probability === PROBABILITY.WON) {
        valueForDeal += await this.CalcLoyalty(deal);
        valueForUse += await this.UseLoyalty(deal);
        console.log(valueForDeal, valueForUse, customers.length);
      }

      const value = (valueForDeal - valueForUse) / (customers.length || 1);

      for (const customer of customers){
        const loyalty = await this.getLoyaltyOfDeal(customer, deal);

        const limit = await Loyalties.getLoyaltyValue(customer, deal._id)

        console.log(customer.primaryEmail, limit, value)
        if (limit < value * -1) {
          console.log('hhhhhhhhhhhhhhhhh')
          throw new Error('The loyalty used exceeds the accumulated loyalty.');
        }

        const doc = {
          customerId: customer._id,
          modifiedAt: new Date(),
          value,
          dealId: deal._id,
          userId: user?._id,
        }

        if (loyalty) {
          await Loyalties.updateOne({ _id: loyalty._id }, { $set: doc })
        } else {
          await Loyalties.create(doc);
        }
      }
      return
    }

    public static async deleteLoyaltyOfDeal(dealId: string) {
      return Loyalties.deleteOne({ dealId })
    }
  }

  loyaltySchema.loadClass(Loyalty);

  return loyaltySchema;
};

loadClass();

// tslint:disable-next-line
const Companies = model<ILoyaltyDocument, ICompanyModel>('loyalties', loyaltySchema);

export default Companies;
