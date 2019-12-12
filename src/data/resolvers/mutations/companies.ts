import { Companies } from '../../../db/models';
import { ICompany } from '../../../db/models/definitions/companies';
import { MODULE_NAMES } from '../../constants';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherCompanyNames, gatherTagNames, gatherUsernames, LogDesc } from './logUtils';

interface ICompaniesEdit extends ICompany {
  _id: string;
}

const companyMutations = {
  /**
   * Creates a new company
   */
  async companiesAdd(_root, doc: ICompany, { user, docModifier }: IContext) {
    const company = await Companies.createCompany(docModifier(doc), user);

    const { ownerId, parentCompanyId } = doc;

    let extraDesc: LogDesc[] = [];

    if (parentCompanyId) {
      extraDesc = await gatherCompanyNames({
        idFields: [parentCompanyId],
        foreignKey: 'parentCompanyId',
      });
    }

    if (ownerId) {
      extraDesc = await gatherUsernames({
        idFields: [ownerId],
        foreignKey: 'ownerId',
        prevList: extraDesc,
      });
    } else {
      extraDesc.push({ ownerId: user._id, name: user.username || user.email });
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.COMPANY,
        newData: JSON.stringify(doc),
        object: company,
        description: `"${company.primaryName}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
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

    const { ownerId, parentCompanyId } = doc;

    const ownerIds: string[] = [];
    const parentIds: string[] = [];
    let extraDesc: LogDesc[] = [];

    if (ownerId) {
      ownerIds.push(ownerId);
    }
    if (company.ownerId && company.ownerId !== ownerId) {
      ownerIds.push(company.ownerId);
    }

    if (parentCompanyId) {
      parentIds.push(parentCompanyId);
    }
    if (company.parentCompanyId && company.parentCompanyId !== parentCompanyId) {
      parentIds.push(company.parentCompanyId);
    }

    if (ownerIds.length > 0) {
      extraDesc = await gatherUsernames({
        idFields: ownerIds,
        foreignKey: 'ownerId',
      });
    }

    if (parentIds.length > 0) {
      extraDesc = await gatherCompanyNames({
        idFields: parentIds,
        foreignKey: 'parentCompanyId',
        prevList: extraDesc,
      });
    }

    if (company.mergedIds && company.mergedIds.length > 0) {
      extraDesc = await gatherCompanyNames({
        idFields: company.mergedIds,
        foreignKey: 'mergedIds',
        prevList: extraDesc,
      });
    }

    if (company.tagIds && company.tagIds.length > 0) {
      extraDesc = await gatherTagNames({
        idFields: company.tagIds,
        foreignKey: 'tagIds',
        prevList: extraDesc,
      });
    }

    await putUpdateLog(
      {
        type: MODULE_NAMES.COMPANY,
        object: company,
        newData: JSON.stringify(doc),
        description: `"${company.primaryName}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Removes companies
   */
  async companiesRemove(_root, { companyIds }: { companyIds: string[] }, { user }: IContext) {
    const companies = await Companies.find(
      { _id: { $in: companyIds } },
      { primaryName: 1, ownerId: 1, parentCompanyId: 1, mergedIds: 1, tagIds: 1 },
    ).lean();

    await Companies.removeCompanies(companyIds);

    for (const company of companies) {
      let extraDesc: LogDesc[] = [];

      if (company.ownerId) {
        extraDesc = await gatherUsernames({
          idFields: [company.ownerId],
          foreignKey: 'ownerId',
        });
      }

      if (company.parentCompanyId) {
        extraDesc = await gatherCompanyNames({
          idFields: [company.parentCompanyId],
          foreignKey: 'parentCompanyId',
          prevList: extraDesc,
        });
      }

      if (company.mergedIds && company.mergedIds.length > 0) {
        extraDesc = await gatherCompanyNames({
          idFields: company.mergedIds,
          foreignKey: 'mergedIds',
          prevList: extraDesc,
        });
      }

      if (company.tagIds && company.tagIds.length > 0) {
        extraDesc = await gatherTagNames({
          idFields: company.tagIds,
          foreignKey: 'tagIds',
          prevList: extraDesc,
        });
      }

      await putDeleteLog(
        {
          type: MODULE_NAMES.COMPANY,
          object: company,
          description: `"${company.primaryName}" has been removed`,
          extraDesc: JSON.stringify(extraDesc),
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
