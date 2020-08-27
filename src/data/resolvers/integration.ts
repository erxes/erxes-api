import { Brands, Channels, Forms, Tags } from '../../db/models';
import { IIntegrationDocument } from '../../db/models/definitions/integrations';
import { debugExternalApi } from '../../debuggers';
import { IContext } from '../types';

export default {
  brand(integration: IIntegrationDocument) {
    return Brands.findOne({ _id: integration.brandId });
  },

  form(integration: IIntegrationDocument) {
    return Forms.findOne({ _id: integration.formId });
  },

  channels(integration: IIntegrationDocument) {
    return Channels.find({ integrationIds: { $in: [integration._id] } });
  },

  tags(integration: IIntegrationDocument) {
    return Tags.find({ _id: { $in: integration.tagIds || [] } });
  },

  externalIntegrations(integration: IIntegrationDocument, _args, { dataSources }: IContext) {
    try {
      return dataSources.IntegrationsAPI.fetchApi('/integrations', { kind: integration.kind });
    } catch (e) {
      debugExternalApi(e);

      return null;
    }
  },
};
