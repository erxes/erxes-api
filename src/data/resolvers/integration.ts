import { Brands, Channels, Leads, Tags } from '../../db/models';
import { IIntegrationDocument } from '../../db/models/definitions/integrations';

export default {
  brand(integration: IIntegrationDocument) {
    return Brands.findOne({ _id: integration.brandId });
  },

  lead(integration: IIntegrationDocument) {
    return Leads.findOne({ _id: integration.leadId });
  },

  channels(integration: IIntegrationDocument) {
    return Channels.find({ integrationIds: { $in: [integration._id] } });
  },

  tags(integration: IIntegrationDocument) {
    return Tags.find({ _id: { $in: integration.tagIds || [] } });
  },
};
