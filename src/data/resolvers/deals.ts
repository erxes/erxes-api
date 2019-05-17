import { Boards, Companies, Customers, Pipelines, Products, Stages, Users } from '../../db/models';
import { IDealDocument } from '../../db/models/definitions/deals';

export default {
  companies(deal: IDealDocument) {
    return Companies.find({ _id: { $in: deal.companyIds || [] } });
  },

  customers(deal: IDealDocument) {
    return Customers.find({ _id: { $in: deal.customerIds || [] } });
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
    const stage = await Stages.findOne({ _id: deal.stageId });

    if (!stage) {
      return null;
    }

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  async boardId(deal: IDealDocument) {
    const stage = await Stages.findOne({ _id: deal.stageId });

    if (!stage) {
      return null;
    }

    const pipeline = await Pipelines.findOne({ _id: stage.pipelineId });

    if (!pipeline) {
      return null;
    }

    const board = await Boards.findOne({ _id: pipeline.boardId });

    if (!board) {
      return null;
    }

    return board._id;
  },

  async stage(deal: IDealDocument) {
    return Stages.findOne({ _id: deal.stageId });
  },
};
