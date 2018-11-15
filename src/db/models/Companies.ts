import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { companySchema, ICompany, ICompanyDocument } from './definitions/companies';
import { COMPANY_BASIC_INFOS } from './definitions/constants';
import { IUserDocument } from './definitions/users';
import { bulkInsert } from './utils';

export interface ICompanyModel extends Model<ICompanyDocument> {
  checkDuplication(
    companyFields: {
      primaryName?: string;
    },
    idsToExclude?: string[] | string,
  ): never;

  createCompany(doc: ICompany, user?: IUserDocument): Promise<ICompanyDocument>;

  updateCompany(_id: string, doc: ICompany): Promise<ICompanyDocument>;

  updateCustomers(_id: string, customerIds: string[]): Promise<ICompanyDocument>;

  removeCompany(_id: string): void;

  mergeCompanies(companyIds: string[], companyFields: ICompany): Promise<ICompanyDocument>;

  bulkInsert(fieldNames: string[], fieldValues: string[][], user: IUserDocument, models: IModels): Promise<string[]>;
}

export const loadClass = (models: IModels) => {
  class Company {
    /**
     * Checking if company has duplicated unique properties
     */
    public static async checkDuplication(
      companyFields: {
        primaryName?: string;
      },
      idsToExclude?: string[] | string,
    ) {
      const { Companies } = models;

      const query: { [key: string]: any } = {};

      // Adding exclude operator to the query
      if (idsToExclude) {
        query._id = idsToExclude instanceof Array ? { $nin: idsToExclude } : { $ne: idsToExclude };
      }

      if (companyFields.primaryName) {
        // check duplication from primaryName
        let previousEntry = await Companies.find({
          ...query,
          primaryName: companyFields.primaryName,
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated name');
        }

        // check duplication from names
        previousEntry = await Companies.find({
          ...query,
          names: { $in: [companyFields.primaryName] },
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated name');
        }
      }
    }

    /**
     * Create a company
     */
    public static async createCompany(doc: ICompany, user: IUserDocument) {
      const { Companies, Fields } = models;

      // Checking duplicated fields of company
      await Companies.checkDuplication(doc);

      if (!doc.ownerId && user) {
        doc.ownerId = user._id;
      }

      // clean custom field values
      doc.customFieldsData = await Fields.cleanMulti(doc.customFieldsData || {});

      return Companies.create({
        ...doc,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });
    }

    /**
     * Update company
     */
    public static async updateCompany(_id: string, doc: ICompany) {
      const { Companies, Fields } = models;

      // Checking duplicated fields of company
      await Companies.checkDuplication(doc, [_id]);

      if (doc.customFieldsData) {
        // clean custom field values
        doc.customFieldsData = await Fields.cleanMulti(doc.customFieldsData || {});
      }

      await Companies.update({ _id }, { $set: { ...doc, modifiedAt: new Date() } });

      return Companies.findOne({ _id });
    }

    /**
     * Update company customers
     */
    public static async updateCustomers(_id: string, customerIds: string[]) {
      const { Companies, Customers } = models;

      // Removing companyIds from users
      await Customers.updateMany({ companyIds: { $in: [_id] } }, { $pull: { companyIds: _id } });

      // Adding companyId to the each customers
      for (const customerId of customerIds) {
        await Customers.findByIdAndUpdate({ _id: customerId }, { $addToSet: { companyIds: _id } }, { upsert: true });
      }

      return Companies.findOne({ _id });
    }

    /**
     * Remove company
     */
    public static async removeCompany(companyId: string) {
      const { Companies, ActivityLogs, InternalNotes, Customers } = models;

      // Removing modules associated with company
      await ActivityLogs.removeCompanyActivityLog(companyId);
      await InternalNotes.removeCompanyInternalNotes(companyId);

      await Customers.updateMany({ companyIds: { $in: [companyId] } }, { $pull: { companyIds: companyId } });

      return Companies.remove({ _id: companyId });
    }

    /**
     * Merge companies
     */
    public static async mergeCompanies(companyIds: string[], companyFields: ICompany) {
      const { Companies, Customers, ActivityLogs, InternalNotes, Deals } = models;

      // Checking duplicated fields of company
      await this.checkDuplication(companyFields, companyIds);

      let tagIds: string[] = [];
      let names: string[] = [];
      let emails: string[] = [];
      let phones: string[] = [];

      // Merging company tags
      for (const companyId of companyIds) {
        const companyObj = await Companies.findOne({ _id: companyId });

        if (companyObj) {
          const companyTags = companyObj.tagIds || [];
          const companyNames = companyObj.names || [];
          const companyEmails = companyObj.emails || [];
          const companyPhones = companyObj.phones || [];

          // Merging company's tag into 1 array
          tagIds = tagIds.concat(companyTags);

          // Merging company names
          names = names.concat(companyNames);

          // Merging company emails
          emails = emails.concat(companyEmails);

          // Merging company phones
          phones = phones.concat(companyPhones);

          // Removing company
          await Companies.remove({ _id: companyId });
        }
      }

      // Removing Duplicated Tags from company
      tagIds = Array.from(new Set(tagIds));

      // Removing Duplicated names from company
      names = Array.from(new Set(names));

      // Removing Duplicated names from company
      emails = Array.from(new Set(emails));

      // Removing Duplicated names from company
      phones = Array.from(new Set(phones));

      // Creating company with properties
      const company = await Companies.createCompany({
        ...companyFields,
        tagIds,
        names,
        emails,
        phones,
      });

      // Updating customer companies
      for (const companyId of companyIds) {
        await Customers.updateMany({ companyIds: { $in: [companyId] } }, { $push: { companyIds: company._id } });

        await Customers.updateMany({ companyIds: { $in: [companyId] } }, { $pull: { companyIds: companyId } });
      }

      // Removing modules associated with current companies
      await ActivityLogs.changeCompany(company._id, companyIds);
      await InternalNotes.changeCompany(company._id, companyIds);
      await Deals.changeCompany(company._id, companyIds);

      return company;
    }

    /**
     * Imports customers with basic fields and custom properties
     */
    public static async bulkInsert(fieldNames: string[], fieldValues: string[][], user: IUserDocument) {
      const params = {
        fieldNames,
        fieldValues,
        user,
        basicInfos: COMPANY_BASIC_INFOS,
        contentType: 'company',
        create: (doc, userObj) => this.createCompany(doc, userObj),
        models,
      };

      return bulkInsert(params);
    }
  }

  companySchema.loadClass(Company);

  return companySchema;
};
