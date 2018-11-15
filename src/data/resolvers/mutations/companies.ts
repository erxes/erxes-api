import { IContext } from '../../../connectionResolver';
import { ICompany } from '../../../db/models/definitions/companies';
import { moduleRequireLogin } from '../../permissions';

interface ICompaniesEdit extends ICompany {
  _id: string;
}

const companyMutations = {
  /**
   * Create new company also adds Company registration log
   */
  async companiesAdd(_root, doc: ICompany, { user, models }: IContext) {
    const { Companies, ActivityLogs } = models;

    const company = await Companies.createCompany(doc, user);

    await ActivityLogs.createCompanyRegistrationLog(company, user);

    return company;
  },

  /**
   * Update company
   */
  async companiesEdit(_root, { _id, ...doc }: ICompaniesEdit, { models }: IContext) {
    const { Companies } = models;

    return Companies.updateCompany(_id, doc);
  },

  /**
   * Update company Customers
   */
  async companiesEditCustomers(
    _root,
    { _id, customerIds }: { _id: string; customerIds: string[] },
    { models }: IContext,
  ) {
    const { Companies } = models;

    return Companies.updateCustomers(_id, customerIds);
  },

  /**
   * Remove companies
   */
  async companiesRemove(_root, { companyIds }: { companyIds: string[] }, { models }: IContext) {
    const { Companies } = models;

    for (const companyId of companyIds) {
      // Removing every company and modules associated with
      await Companies.removeCompany(companyId);
    }

    return companyIds;
  },

  /**
   * Merge companies
   */
  async companiesMerge(
    _root,
    { companyIds, companyFields }: { companyIds: string[]; companyFields: ICompany },
    { models }: IContext,
  ) {
    const { Companies } = models;

    return Companies.mergeCompanies(companyIds, companyFields);
  },
};

moduleRequireLogin(companyMutations);

export default companyMutations;
