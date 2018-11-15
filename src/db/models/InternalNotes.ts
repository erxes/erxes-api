import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { COC_CONTENT_TYPES } from './definitions/constants';
import { IInternalNote, IInternalNoteDocument, internalNoteSchema } from './definitions/internalNotes';
import { IUserDocument } from './definitions/users';

export interface IInternalNoteModel extends Model<IInternalNoteDocument> {
  createInternalNote(
    { contentType, contentTypeId, ...fields }: IInternalNote,
    user: IUserDocument,
  ): Promise<IInternalNoteDocument>;

  updateInternalNote(_id: string, doc: IInternalNote): Promise<IInternalNoteDocument>;

  removeInternalNote(_id: string): void;

  changeCustomer(newCustomerId: string, customerIds: string[]): Promise<IInternalNoteDocument[]>;

  removeCustomerInternalNotes(customerId: string): void;
  removeCompanyInternalNotes(companyId: string): void;

  changeCompany(newCompanyId: string, oldCompanyIds: string[]): Promise<IInternalNoteDocument[]>;
}

export const loadClass = (models: IModels) => {
  class InternalNote {
    /*
     * Create new internalNote
     */
    public static async createInternalNote(
      { contentType, contentTypeId, ...fields }: IInternalNote,
      user: IUserDocument,
    ) {
      const { InternalNotes } = models;

      return InternalNotes.create({
        contentType,
        contentTypeId,
        createdUserId: user._id,
        createdDate: new Date(),
        ...fields,
      });
    }

    /*
     * Update internalNote
     */
    public static async updateInternalNote(_id: string, doc: IInternalNote) {
      const { InternalNotes } = models;

      await InternalNotes.update({ _id }, { $set: doc });

      return InternalNotes.findOne({ _id });
    }

    /*
     * Remove internalNote
     */
    public static async removeInternalNote(_id: string) {
      const { InternalNotes } = models;

      const internalNoteObj = await InternalNotes.findOne({ _id });

      if (!internalNoteObj) {
        throw new Error(`InternalNote not found with id ${_id}`);
      }

      return internalNoteObj.remove();
    }

    /**
     * Transfers customers' internal notes to another customer
     */
    public static async changeCustomer(newCustomerId: string, customerIds: string[]) {
      const { InternalNotes } = models;

      for (const customerId of customerIds) {
        // Updating every internal notes of customer
        await InternalNotes.updateMany(
          {
            contentType: COC_CONTENT_TYPES.CUSTOMER,
            contentTypeId: customerId,
          },
          { contentTypeId: newCustomerId },
        );
      }

      // Returning updated list of internal notes of new customer
      return InternalNotes.find({
        contentType: COC_CONTENT_TYPES.CUSTOMER,
        contentTypeId: newCustomerId,
      });
    }

    /**
     * Removing customers' internal notes
     */
    public static async removeCustomerInternalNotes(customerId: string) {
      const { InternalNotes } = models;

      // Removing every internal ntoes of customer
      return InternalNotes.remove({
        contentType: COC_CONTENT_TYPES.CUSTOMER,
        contentTypeId: customerId,
      });
    }

    /**
     * Removing companies' internal notes
     */
    public static async removeCompanyInternalNotes(companyId: string) {
      const { InternalNotes } = models;

      // Removing every internal notes of company
      return InternalNotes.remove({
        contentType: COC_CONTENT_TYPES.COMPANY,
        contentTypeId: companyId,
      });
    }

    /**
     * Transfers companies' internal notes to another company
     */
    public static async changeCompany(newCompanyId: string, oldCompanyIds: string[]) {
      const { InternalNotes } = models;

      for (const companyId of oldCompanyIds) {
        // Updating every internal notes of company
        await InternalNotes.updateMany(
          {
            contentType: COC_CONTENT_TYPES.COMPANY,
            contentTypeId: companyId,
          },
          { contentTypeId: newCompanyId },
        );
      }

      // Returning updated list of internal notes of new company
      return InternalNotes.find({
        contentType: COC_CONTENT_TYPES.COMPANY,
        contentTypeId: newCompanyId,
      });
    }
  }

  internalNoteSchema.loadClass(InternalNote);

  return internalNoteSchema;
};
