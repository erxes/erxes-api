import { Companies } from '../../../db/models';
import { ICompany } from '../../../db/models/definitions/companies';
import { MODULE_NAMES } from '../../constants';
import { gatherCompanyFieldNames, LogDesc, putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ICompaniesEdit extends ICompany {
  _id: string;
}

const companyMutations = {
  /**
   * Creates a new company
   */
  async companiesAdd(_root, doc: ICompany, { user, docModifier }: IContext) {
    const company = await Companies.createCompany(docModifier(doc), user);

    const extraDesc: LogDesc[] = await gatherCompanyFieldNames(company);

    await putCreateLog(
      {
        type: MODULE_NAMES.COMPANY,
        newData: doc,
        object: company,
        description: `"${company.primaryName}" has been created`,
        extraDesc,
      },
      user,
    );

    return company;
  },

  /**
   * Updates a company
   */
  async companiesEdit(_root, { _id, ...doc }: ICompaniesEdit, { user }: IContext) {
    const company = await Companies.getCompany(_id);
    const updated = await Companies.updateCompany(_id, doc);

    let extraDesc: LogDesc[] = await gatherCompanyFieldNames(company);

    extraDesc = await gatherCompanyFieldNames(updated, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.COMPANY,
        object: company,
        newData: doc,
        description: `"${company.primaryName}" has been edited`,
        extraDesc,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes companies
   */
  async companiesRemove(_root, { companyIds }: { companyIds: string[] }, { user }: IContext) {
    const companies = await Companies.find({ _id: { $in: companyIds } }).lean();

    await Companies.removeCompanies(companyIds);

    for (const company of companies) {
      const extraDesc: LogDesc[] = await gatherCompanyFieldNames(company);

      await putDeleteLog(
        {
          type: MODULE_NAMES.COMPANY,
          object: company,
          description: `"${company.primaryName}" has been removed`,
          extraDesc,
        },
        user,
      );
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
checkPermission(companyMutations, 'companiesRemove', 'companiesRemove');
checkPermission(companyMutations, 'companiesMerge', 'companiesMerge');

export default companyMutations;
