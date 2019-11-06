import { Conformities, Customers } from '../../../db/models';
import { IConversationDocument } from '../../../db/models/definitions/conversations';

export const createConformotyForConversation = async (conversation: IConversationDocument) => {
  const customer = await Customers.findOne({ _id: conversation.customerId });

  if (!customer || !customer._id) {
    return;
  }

  const companyIds = await Conformities.savedConformity({
    mainType: 'customer',
    mainTypeId: customer._id,
    relType: 'company',
  });

  for (const companyId of companyIds) {
    // check against duplication
    const companyConformities = await Conformities.findOne({ mainTypeId: companyId, relTypeId: conversation._id });

    if (!companyConformities) {
      await Conformities.addConformity({
        mainType: 'company',
        mainTypeId: companyId,
        relType: 'conversation',
        relTypeId: conversation._id,
      });
    }
  }

  // check against duplication ======
  const customerConformities = await Conformities.findOne({
    mainTypeId: customer._id,
    relTypeId: conversation._id,
  });

  if (!customerConformities) {
    await Conformities.addConformity({
      mainType: 'customer',
      mainTypeId: customer._id,
      relType: 'conversation',
      relTypeId: conversation._id,
    });
  }
};
