import { Fields, Notifications, Products } from '../../db/models';
import { IDealDocument } from '../../db/models/definitions/deals';
import { IContext } from '../types';
import { boardId } from './boardUtils';

export default {
  async companies(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.companiesLoader.load(deal._id);
  },

  async customers(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.customersLoader.load(deal._id);
  },

  async products(deal: IDealDocument) {
    const products: any = [];

    for (const data of deal.productsData || []) {
      if (!data.productId) {
        continue;
      }

      const product = await Products.getProduct({ _id: data.productId });

      const { customFieldsData } = product;

      if (customFieldsData) {
        const customFields = {};
        const fieldIds: string[] = [];

        Object.keys(customFieldsData).forEach(_id => {
          fieldIds.push(_id);
        });

        const fields = await Fields.find({ _id: { $in: fieldIds }, contentType: 'product' });

        for (const field of fields) {
          customFields[field._id] = {
            text: field.text,
            data: customFieldsData[field._id],
          };
        }

        product.customFieldsData = customFields;
      }

      // Add product object to resulting list
      products.push({
        ...data.toJSON(),
        product: product.toJSON(),
      });
    }

    return products;
  },

  amount(deal: IDealDocument) {
    const data = deal.productsData;
    const amountsMap = {};

    (data || []).forEach(product => {
      const type = product.currency;

      if (type) {
        if (!amountsMap[type]) {
          amountsMap[type] = 0;
        }

        amountsMap[type] += product.amount || 0;
      }
    });

    return amountsMap;
  },

  assignedUsers(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.assignedUsersLoader.load(deal.assignedUserIds || []);
  },

  async pipeline(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.pipelineLoader.load(deal.stageId);
  },

  boardId(deal: IDealDocument) {
    return boardId(deal);
  },

  stage(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.stageLoader.load(deal.stageId);
  },

  isWatched(deal: IDealDocument, _args, { user }: IContext) {
    const watchedUserIds = deal.watchedUserIds;

    if (watchedUserIds && watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },

  hasNotified(deal: IDealDocument, _args, { user }: IContext) {
    return Notifications.checkIfRead(user._id, deal._id);
  },

  labels(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.pipelineLabelsLoader.load(deal.labelIds || []);
  },

  createdUser(deal: IDealDocument, _args, { loaders }: IContext) {
    const { dealLoaders } = loaders;

    return dealLoaders.userLoader.load(deal.userId || '');
  },
};
