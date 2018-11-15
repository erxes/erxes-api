import * as Random from 'meteor-random';
import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { brandSchema, IBrand, IBrandDocument, IBrandEmailConfig } from './definitions/brands';
import { IIntegrationDocument } from './definitions/integrations';

export interface IBrandModel extends Model<IBrandDocument> {
  generateCode(code: string): string;
  createBrand(doc: IBrand): IBrandDocument;
  updateBrand(_id: string, fields: IBrand): IBrandDocument;
  removeBrand(_id: string): void;
  updateEmailConfig(_id: string, emailConfig: IBrandEmailConfig): IBrandDocument;
  manageIntegrations({ _id, integrationIds }: { _id: string; integrationIds: string[] }): IIntegrationDocument[];
}

export const loadClass = (models: IModels) => {
  class Brand {
    public static async generateCode(code?: string) {
      const { Brands } = models;

      let generatedCode = code || Random.id().substr(0, 6);

      let prevBrand = await Brands.findOne({ code: generatedCode });

      // search until not existing one found
      while (prevBrand) {
        generatedCode = Random.id().substr(0, 6);

        prevBrand = await Brands.findOne({ code: generatedCode });
      }

      return generatedCode;
    }

    public static async createBrand(doc: IBrand) {
      const { Brands } = models;

      // generate code automatically
      // if there is no brand code defined
      return Brands.create({
        ...doc,
        code: await this.generateCode(),
        createdAt: new Date(),
        emailConfig: { type: 'simple' },
      });
    }

    public static async updateBrand(_id: string, fields: IBrand) {
      const { Brands } = models;

      await Brands.update({ _id }, { $set: { ...fields } });
      return Brands.findOne({ _id });
    }

    public static async removeBrand(_id) {
      const { Brands } = models;

      const brandObj = await Brands.findOne({ _id });

      if (!brandObj) {
        throw new Error(`Brand not found with id ${_id}`);
      }

      return brandObj.remove();
    }

    public static async updateEmailConfig(_id: string, emailConfig: IBrandEmailConfig) {
      const { Brands } = models;

      await Brands.update({ _id }, { $set: { emailConfig } });

      return Brands.findOne({ _id });
    }

    public static async manageIntegrations({ _id, integrationIds }: { _id: string; integrationIds: string[] }) {
      const { Integrations } = models;

      await Integrations.update({ _id: { $in: integrationIds } }, { $set: { brandId: _id } }, { multi: true });

      return Integrations.find({ _id: { $in: integrationIds } });
    }
  }

  brandSchema.loadClass(Brand);

  return brandSchema;
};
