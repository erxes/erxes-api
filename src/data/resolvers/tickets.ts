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
import { ITicketDocument } from '../../db/models/definitions/tickets';
import { IContext } from '../types';
import { boardId } from './boardUtils';

export default {
  async companies(ticket: ITicketDocument) {
    const companyIds = await Conformities.savedConformity({
      mainType: 'ticket',
      mainTypeId: ticket._id,
      relTypes: ['company'],
    });

    return Companies.find({ _id: { $in: companyIds || [] } });
  },

  async customers(ticket: ITicketDocument) {
    const customerIds = await Conformities.savedConformity({
      mainType: 'ticket',
      mainTypeId: ticket._id,
      relTypes: ['customer'],
    });

    return Customers.find({ _id: { $in: customerIds || [] } });
  },

  assignedUsers(ticket: ITicketDocument) {
    return Users.find({ _id: { $in: ticket.assignedUserIds || [] } });
  },

  async pipeline(ticket: ITicketDocument) {
    const stage = await Stages.getStage(ticket.stageId);

    return Pipelines.findOne({ _id: stage.pipelineId });
  },

  boardId(ticket: ITicketDocument) {
    return boardId(ticket);
  },

  stage(ticket: ITicketDocument) {
    return Stages.getStage(ticket.stageId);
  },

  isWatched(ticket: ITicketDocument, _args, { user }: IContext) {
    const watchedUserIds = ticket.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },

  hasNotified(ticket: ITicketDocument, _args, { user }: IContext) {
    return Notifications.checkIfRead(user._id, ticket._id);
  },

  labels(ticket: ITicketDocument) {
    return PipelineLabels.find({ _id: { $in: ticket.labelIds || [] } });
  },

  async products(ticket: ITicketDocument) {
    const products: any = [];

    for (const data of ticket.productsData || []) {
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

  amount(ticket: ITicketDocument) {
    const data = ticket.productsData;
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
};
