import {
  Companies,
  Conformities,
  Customers,
  Fields,
  Notifications,
  PipelineLabels,
  Pipelines,
  Products,
  Stages,
  Users,
} from '../../db/models';
import { IDealDocument } from '../../db/models/definitions/deals';
import { IContext } from '../types';
import { boardId } from './boardUtils';

export default {
  async companies(deal: IDealDocument) {
    const companyIds = await Conformities.savedConformity({
      mainType: 'deal',
      mainTypeId: deal._id,
      relTypes: ['company'],
    });

    return Companies.find({ _id: { $in: companyIds } });
  },

  async customers(deal: IDealDocument) {
    const customerIds = await Conformities.savedConformity({
      mainType: 'deal',
      mainTypeId: deal._id,
      relTypes: ['customer'],
    });

    return Customers.find({ _id: { $in: customerIds } });
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

  assignedUsers(deal: IDealDocument) {
    return Users.find({ _id: { $in: deal.assignedUserIds } });
  },

  async pipeline(deal: IDealDocument) {
    const stage = await Stages.getStage(deal.stageId);

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(deal: IDealDocument) {
    return boardId(deal);
  },

  stage(deal: IDealDocument) {
    return Stages.getStage(deal.stageId);
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

  labels(deal: IDealDocument) {
    return PipelineLabels.find({ _id: { $in: deal.labelIds } });
  },

  createdUser(deal: IDealDocument) {
    return Users.findOne({ _id: deal.userId });
  },
};
