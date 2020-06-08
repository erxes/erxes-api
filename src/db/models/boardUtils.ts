import { Companies, Conformities, Customers, Deals, GrowthHacks, Tasks, Tickets } from '.';
import { validSearchText } from '../../data/utils';
import { IItemCommonFields, IOrderInput } from './definitions/boards';
import { ICompanyDocument } from './definitions/companies';
import { BOARD_TYPES } from './definitions/constants';
import { ICustomerDocument } from './definitions/customers';

interface ISetOrderParam {
  collection: any;
  stageId: string;
  prevItemId?: string;
}

const round = (num: number, fixed: number = 0) => {
  return parseFloat(num.toFixed(fixed));
};

export const getNewOrder = async ({collection, stageId, prevItemId }: ISetOrderParam) => {
  let afterOrder = 0;
  let prevOrder = 0;

  if (prevItemId) {
    const prevItem = await collection.findOne({_id: prevItemId});
    prevOrder = prevItem.order;

    const nextItems = await collection.find({stageId, order: {$gt: prevOrder}}).sort({order: 1}).limit(1);
    if (nextItems.length === 1) {
      afterOrder = nextItems[0].order;
    }

  } else {
    const firstItems = await collection.find({stageId}).sort({order:1}).limit(1);

    if (firstItems.length === 1) {
      afterOrder = firstItems[0].order;
    }
  }

  // empty stage
  if (!prevOrder && !afterOrder) {
    return 100;
  }

  // end of stage
  if (!afterOrder) {
    return round(prevOrder) + 10;
  }

  const splitAfter = afterOrder.toString().split('.');
  const fraction = '0.'.concat(splitAfter[1] || '0');

  // begin of stage
  if (!prevOrder) {
    const afterLen = fraction.length;
    const afterDotLen = fraction === '0.0' ? 1 : 0;
    const diffIs1Len = afterOrder.toString().substr(-1) === '1' ? 1 : 0;

    return round(
      afterOrder - 0.1 ** (afterLen - 2 - afterDotLen + diffIs1Len),
      afterLen + diffIs1Len
    );
  }

  // between items on stage
  const prevFraction = '0.'.concat(prevOrder.toString().split('.')[1] || '0');
  const diffLen =
    prevFraction.length > fraction.length
      ? prevFraction.length
      : fraction.length;

  const diff = round(afterOrder - prevOrder, diffLen);
  const dotLen = fraction === '0.0' && prevFraction === '0.0' ? 1 : 0;
  const is1Len = diff.toString().substr(-1) === '1' ? 1 : 0;

  return round(
    afterOrder - 0.1 ** (diffLen - 2 - dotLen + is1Len),
    diffLen + is1Len
  );
}

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
