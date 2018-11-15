import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { IMessengerApp, IMessengerAppDocument, messengerAppSchema } from './definitions/messengerApps';

export interface IMessengerAppModel extends Model<IMessengerAppDocument> {
  createApp(doc: IMessengerApp): Promise<IMessengerAppDocument>;
}

export const loadClass = (models: IModels) => {
  class MessengerApp {
    public static async createApp(doc: IMessengerApp) {
      const { MessengerApps } = models;
      return MessengerApps.create(doc);
    }
  }

  messengerAppSchema.loadClass(MessengerApp);

  return messengerAppSchema;
};
