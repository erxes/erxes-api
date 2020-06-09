import { Companies, Conformities, Customers, Deals, GrowthHacks, Tasks, Tickets } from '.';
import { validSearchText } from '../../data/utils';
import { IItemCommonFields, IOrderInput } from './definitions/boards';
import { ICompanyDocument } from './definitions/companies';
import { BOARD_TYPES } from './definitions/constants';
import { ICustomerDocument } from './definitions/customers';

interface ISetOrderParam {
  collection: any;
  stageId: string;
  aboveItemId?: string;
}

const round = (num: number, fixed: number = 0) => {
  return parseFloat(num.toFixed(fixed));
};

export const getNewOrder = async ({ collection, stageId, aboveItemId }: ISetOrderParam) => {
  const prevItem = await collection.findOne({ _id: aboveItemId });

  const aboveOrder = prevItem?.order || 0;

  const nextItems = await collection
    .find({ stageId, order: { $gt: aboveOrder } })
    .sort({ order: 1 })
    .limit(1);

  const belowOrder = nextItems[0]?.order;

  // empty stage
  if (!aboveOrder && !belowOrder) {
    return 100;
  }

  // end of stage
  if (!belowOrder) {
    return round(aboveOrder) + 10;
  }

  const splitAfter = belowOrder.toString().split('.');
  const fraction = '0.'.concat(splitAfter[1] || '0');

  // begin of stage
  if (!aboveOrder) {
    const afterLen = fraction.length;
    const afterDotLen = fraction === '0.0' ? 1 : 0;
    const diffIs1Len = belowOrder.toString().substr(-1) === '1' ? 1 : 0;

    return round(belowOrder - 0.1 ** (afterLen - 2 - afterDotLen + diffIs1Len), afterLen + diffIs1Len);
  }

  // between items on stage
  const prevFraction = '0.'.concat(aboveOrder.toString().split('.')[1] || '0');
  const diffLen = prevFraction.length > fraction.length ? prevFraction.length : fraction.length;

  const diff = round(belowOrder - aboveOrder, diffLen);
  const dotLen = fraction === '0.0' && prevFraction === '0.0' ? 1 : 0;
  const is1Len = diff.toString().substr(-1) === '1' ? 1 : 0;

  return round(belowOrder - 0.1 ** (diffLen - 2 - dotLen + is1Len), diffLen + is1Len);
};

export const updateOrder = async (collection: any, orders: IOrderInput[]) => {
  if (orders.length === 0) {
    return [];
  }

  const ids: string[] = [];
  const bulkOps: Array<{
    updateOne: {
      filter: { _id: string };
      update: { order: number };
    };
  }> = [];

  for (const { _id, order } of orders) {
    ids.push(_id);

    const selector: { order: number } = { order };

    bulkOps.push({
      updateOne: {
        filter: { _id },
        update: selector,
      },
    });
  }

  await collection.bulkWrite(bulkOps);

  return collection.find({ _id: { $in: ids } }).sort({ order: 1 });
};

export const watchItem = async (collection: any, _id: string, isAdd: boolean, userId: string) => {
  const item = await collection.findOne({ _id });

  const watchedUserIds = item.watchedUserIds || [];

  if (isAdd) {
    watchedUserIds.push(userId);
  } else {
    const index = watchedUserIds.indexOf(userId);

    watchedUserIds.splice(index, 1);
  }

  await collection.updateOne({ _id }, { $set: { watchedUserIds } });

  return collection.findOne({ _id });
};

export const fillSearchTextItem = (doc: IItemCommonFields, item?: IItemCommonFields) => {
  const document = item || { name: '', description: '' };
  Object.assign(document, doc);

  return validSearchText([document.name || '', document.description || '']);
};

export const getCollection = (type: string) => {
  let collection;

  switch (type) {
    case BOARD_TYPES.DEAL: {
      collection = Deals;

      break;
    }
    case BOARD_TYPES.GROWTH_HACK: {
      collection = GrowthHacks;

      break;
    }
    case BOARD_TYPES.TASK: {
      collection = Tasks;

      break;
    }
    case BOARD_TYPES.TICKET: {
      collection = Tickets;

      break;
    }
  }

  return collection;
};

export const getCompanies = async (mainType: string, mainTypeId: string): Promise<ICompanyDocument[]> => {
  const conformities = await Conformities.find({ mainType, mainTypeId, relType: 'company' });

  const companyIds = conformities.map(c => c.relTypeId);

  return Companies.find({ _id: { $in: companyIds } });
};

export const getCustomers = async (mainType: string, mainTypeId: string): Promise<ICustomerDocument[]> => {
  const conformities = await Conformities.find({ mainType, mainTypeId, relType: 'customer' });

  const customerIds = conformities.map(c => c.relTypeId);

  return Customers.find({ _id: { $in: customerIds } });
};
