import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { IResponseTemplate, IResponseTemplateDocument, responseTemplateSchema } from './definitions/responseTemplates';

export interface IResponseTemplateModel extends Model<IResponseTemplateDocument> {
  updateResponseTemplate(_id: string, fields: IResponseTemplate): Promise<IResponseTemplateDocument>;

  removeResponseTemplate(_id: string): void;
}

export const loadClass = (models: IModels) => {
  class ResponseTemplate {
    /**
     * Update response template
     */
    public static async updateResponseTemplate(_id: string, fields: IResponseTemplate) {
      const { ResponseTemplates } = models;

      await ResponseTemplates.update({ _id }, { $set: { ...fields } });

      return ResponseTemplates.findOne({ _id });
    }

    /**
     * Delete response template
     */
    public static async removeResponseTemplate(_id: string) {
      const { ResponseTemplates } = models;

      const responseTemplateObj = await ResponseTemplates.findOne({ _id });

      if (!responseTemplateObj) {
        throw new Error(`Response template not found with id ${_id}`);
      }

      return responseTemplateObj.remove();
    }
  }

  responseTemplateSchema.loadClass(ResponseTemplate);

  return responseTemplateSchema;
};
