import { Companies } from '../../../db/models';
import { ICompany } from '../../../db/models/definitions/companies';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface ICompaniesEdit extends ICompany {
  _id: string;
}

const companyMutations = {
  /**
   * Create new company also adds Company registration log
   */
  async companiesAdd(_root, doc: ICompany, { user }: { user: IUserDocument }) {
    const company = await Companies.createCompany(doc, user);

    await putLog(
      {
        type: 'company',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(doc),
        objectId: company._id,
        description: `${company.primaryName} has been created`,
      },
      user,
    );

    return company;
  },

  /**
   * Updates a company
   */
  async companiesEdit(_root, { _id, ...doc }: ICompaniesEdit, { user }: { user: IUserDocument }) {
    const found = await Companies.findOne({ _id });
    const updated = await Companies.updateCompany(_id, doc);

    if (found) {
      await putLog(
        {
          type: 'company',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(found),
          newData: JSON.stringify(doc),
          objectId: _id,
          description: `${found.primaryName} has been updated`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Update company Customers
   */
  async companiesEditCustomers(_root, { _id, customerIds }: { _id: string; customerIds: string[] }) {
    return Companies.updateCustomers(_id, customerIds);
  },

  /**
   * Remove companies
   */
  async companiesRemove(_root, { companyIds }: { companyIds: string[] }, { user }: { user: IUserDocument }) {
    for (const companyId of companyIds) {
      const company = await Companies.findOne({ _id: companyId });
      // Removing every company and modules associated with
      const removed = await Companies.removeCompany(companyId);

      if (company && removed) {
        await putLog(
          {
            type: 'company',
            action: LOG_ACTIONS.DELETE,
            oldData: JSON.stringify(company),
            objectId: companyId,
            description: `${company.primaryName} has been removed`,
          },
          user,
        );
      }
    }

    return companyIds;
  },

  /**
   * Merge companies
   */
  async companiesMerge(_root, { companyIds, companyFields }: { companyIds: string[]; companyFields: ICompany }) {
    return Companies.mergeCompanies(companyIds, companyFields);
  },
};

checkPermission(companyMutations, 'companiesAdd', 'companiesAdd');
checkPermission(companyMutations, 'companiesEdit', 'companiesEdit');
checkPermission(companyMutations, 'companiesEditCustomers', 'companiesEditCustomers');
checkPermission(companyMutations, 'companiesRemove', 'companiesRemove');
checkPermission(companyMutations, 'companiesMerge', 'companiesMerge');

export default companyMutations;
