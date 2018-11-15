import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { emailTemplateSchema, IEmailTemplate, IEmailTemplateDocument } from './definitions/emailTemplates';

export interface IEmailTemplateModel extends Model<IEmailTemplateDocument> {
  updateEmailTemplate(_id: string, fields: IEmailTemplate): IEmailTemplateDocument;

  removeEmailTemplate(_id: string): void;
}

export const loadClass = (models: IModels) => {
  class EmailTemplate {
    /**
     * Update email template
     */
    public static async updateEmailTemplate(_id: string, fields: IEmailTemplate) {
      const { EmailTemplates } = models;

      await EmailTemplates.update({ _id }, { $set: fields });

      return EmailTemplates.findOne({ _id });
    }

    /**
     * Delete email template
     */
    public static async removeEmailTemplate(_id: string) {
      const { EmailTemplates } = models;

      const emailTemplateObj = await EmailTemplates.findOne({ _id });

      if (!emailTemplateObj) {
        throw new Error(`Email template not found with id ${_id}`);
      }

      return emailTemplateObj.remove();
    }
  }

  emailTemplateSchema.loadClass(EmailTemplate);

  return emailTemplateSchema;
};
