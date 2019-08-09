import { Companies, Conversations, Integrations, Tags, Users } from '../../db/models';
import { ICustomerDocument } from '../../db/models/definitions/customers';
import { getSavedConformity } from '../modules/conformity/conformityUtils';

interface IMessengerCustomData {
  name: string;
  value: string;
}

export default {
  integration(customer: ICustomerDocument) {
    return Integrations.findOne({ _id: customer.integrationId });
  },

  getIntegrationData(customer: ICustomerDocument) {
    return {
      messenger: customer.messengerData || {},
      // TODO: Add other integration data
    };
  },

  getMessengerCustomData(customer: ICustomerDocument) {
    const results: IMessengerCustomData[] = [];
    const messengerData: any = customer.messengerData || {};
    const data = messengerData.customData || {};

    Object.keys(data).forEach(key => {
      results.push({
        name: key.replace(/_/g, ' '),
        value: data[key],
      });
    });

    return results;
  },

  getTags(customer: ICustomerDocument) {
    return Tags.find({ _id: { $in: customer.tagIds || [] } });
  },

  conversations(customer: ICustomerDocument) {
    return Conversations.find({ customerId: customer._id });
  },

  async companies(customer: ICustomerDocument) {
    const companyIds = await getSavedConformity({
      mainType: 'customer',
      mainTypeId: customer._id,
      relType: 'company',
    });
    return Companies.find({ _id: { $in: companyIds || [] } });
  },

  owner(customer: ICustomerDocument) {
    return Users.findOne({ _id: customer.ownerId });
  },
};
