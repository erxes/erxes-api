import { Model, model } from 'mongoose';
import { IWebhook, IWebhookDocument, webhookSchema } from './definitions/webhook';

export interface IWebhookModel extends Model<IWebhookDocument> {
  getWebHook(_id: string): Promise<IWebhookDocument>;
  getWebHooks(isOutgoing: boolean): Promise<IWebhookDocument[]>;
  createWebhook(doc: IWebhook): Promise<IWebhookDocument>;
  updateWebhook(_id: string, doc: IWebhook): Promise<IWebhookDocument>;
  removeWebhooks(ids: string[]): void;
}

export const loadClass = () => {
  class Webhook {
    /*
     * Get a Webhook
     */
    public static async getWebHook(_id: string) {
      const webhook = await Webhooks.findOne({ _id });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      return webhook;
    }

    public static async getWebHooks(isOutgoing) {
      const webhooks = await Webhooks.find({ isOutgoing });

      return webhooks;
    }

    /**
     * Create webhook
     */
    public static async createWebhook(doc: IWebhook) {
      if (!doc.url.includes('https')) {
        throw new Error('Url is not valid. Enter valid url with ssl cerfiticate');
      }
      return Webhooks.create({ ...doc });
    }

    public static async updateWebhook(_id: string, doc: IWebhook) {
      if (!doc.url.includes('https')) {
        throw new Error('Url is not valid. Enter valid url with ssl cerfiticate');
      }

      await Webhooks.updateOne({ _id }, { $set: doc }, { runValidators: true });

      return Webhooks.findOne({ _id });
    }

    public static async removeWebhooks(ids: string[]) {
      return Webhooks.deleteMany({ _id: { $in: ids } });
    }
  }

  webhookSchema.loadClass(Webhook);

  return webhookSchema;
};

loadClass();

// tslint:disable-next-line
const Webhooks = model<IWebhookDocument, IWebhookModel>('webhooks', webhookSchema);

export default Webhooks;
