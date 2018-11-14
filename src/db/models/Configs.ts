import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { configSchema, IConfigDocument } from './definitions/configs';

export interface IConfigModel extends Model<IConfigDocument> {
  createOrUpdateConfig({ code, value }: { code: string; value: string[] }): IConfigDocument;
}

export const loadClass = (models: IModels) => {
  class Config {
    /**
     * Create or update config
     */
    public static async createOrUpdateConfig({ code, value }: { code: string; value: string[] }) {
      const { Configs } = models;

      const obj = await Configs.findOne({ code });

      if (obj) {
        await Configs.update({ _id: obj._id }, { $set: { value } });

        return Configs.findOne({ _id: obj._id });
      }

      return Configs.create({ code, value });
    }
  }

  configSchema.loadClass(Config);

  return configSchema;
};
