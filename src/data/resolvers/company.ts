import { Companies, Customers, Deals, Tags, Users } from '../../db/models';
import { ICompanyDocument } from '../../db/models/definitions/companies';
import { getSavedConformity } from '../modules/conformity/conformityUtils';

export default {
  async customers(company: ICompanyDocument) {
    const customerIds = await getSavedConformity({
      mainType: 'company',
      mainTypeId: company._id,
      relType: 'customer',
    });
    return Customers.find({ _id: { $in: customerIds || [] } });
  },

  getTags(company: ICompanyDocument) {
    return Tags.find({ _id: { $in: company.tagIds || [] } });
  },

  owner(company: ICompanyDocument) {
    return Users.findOne({ _id: company.ownerId });
  },

  parentCompany(company: ICompanyDocument) {
    return Companies.findOne({ _id: company.parentCompanyId });
  },

  deals(company: ICompanyDocument) {
    return Deals.find({ companyIds: { $in: [company._id] || [] } });
  },
};
