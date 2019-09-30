import {
  ChecklistItems,
  Checklists,
  Companies,
  Conformities,
  Customers,
  Notifications,
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
      relType: 'company',
    });

    return Companies.find({ _id: { $in: companyIds || [] } });
  },

  async customers(deal: IDealDocument) {
    const customerIds = await Conformities.savedConformity({
      mainType: 'deal',
      mainTypeId: deal._id,
      relType: 'customer',
    });

    return Customers.find({ _id: { $in: customerIds || [] } });
  },

  async products(deal: IDealDocument) {
    const products: any = [];

    for (const data of deal.productsData || []) {
      const product = await Products.findOne({ _id: data.productId });

      // Add product object to resulting list
      if (data && product) {
        products.push({
          ...data.toJSON(),
          product: product.toJSON(),
        });
      }
    }

    return products;
  },

  amount(deal: IDealDocument) {
    const data = deal.productsData || [];
    const amountsMap = {};

    data.forEach(product => {
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
    const stage = await Stages.getStage(deal.stageId || '');

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(deal: IDealDocument) {
    return boardId(deal);
  },

  stage(deal: IDealDocument) {
    return Stages.getStage(deal.stageId || '');
  },

  isWatched(deal: IDealDocument, _args, { user }: IContext) {
    const watchedUserIds = deal.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },

  hasNotified(deal: IDealDocument, _args, { user }: IContext) {
    return Notifications.checkIfRead(user._id, deal._id);
  },

  async checklistsState(deal: IDealDocument) {
    const checklists = await Checklists.find({ contentType: 'deal', contentTypeId: deal._id });
    if (!checklists) {
      return null;
    }

    const checklistIds = checklists.map(checklist => checklist._id);
    const checkItems = await ChecklistItems.find({ checklistId: { $in: checklistIds } });
    const completedItems = checkItems.filter(item => item.isChecked);

    return { completed: completedItems.length, all: checkItems.length };
  },
};
