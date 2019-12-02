import { Model, model } from 'mongoose';
import { configSchema, IConfig, IConfigDocument } from './definitions/configs';

export interface IConfigModel extends Model<IConfigDocument> {
  getConfig(code: string): Promise<IConfigDocument>;
  createOrUpdateConfig({ code, value }: IConfig): IConfigDocument;
}

export const loadClass = () => {
  class Config {
    /*
     * Get a Config
     */
    public static async getConfig(code: string) {
      const config = await Configs.findOne({ code });

      if (!config) {
        throw new Error('Config not found');
      }

      return config;
    }

    /**
     * Create or update config
     */
    public static async createOrUpdateConfig({ code, value }: { code: string; value: string[] }) {
      const obj = await Configs.findOne({ code });

      if (obj) {
        await Configs.updateOne({ _id: obj._id }, { $set: { value } });

        return Configs.findOne({ _id: obj._id });
      }

      return Configs.create({ code, value });
    }
  }

  configSchema.loadClass(Config);

  return configSchema;
};

loadClass();

// tslint:disable-next-line
const Configs = model<IConfigDocument, IConfigModel>('configs', configSchema);

export default Configs;
