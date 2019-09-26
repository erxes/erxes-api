import { Model, model } from 'mongoose';
import 'mongoose-type-email';
import { ConversationMessages, Conversations, Customers, Forms } from '.';
import { KIND_CHOICES } from './definitions/constants';
import {
  IIntegration,
  IIntegrationDocument,
  ILeadData,
  IMessengerData,
  integrationSchema,
  IUiOptions,
} from './definitions/integrations';

export interface IMessengerIntegration {
  name: string;
  brandId: string;
  languageCode: string;
}

export interface IExternalIntegrationParams {
  kind: string;
  platform?: string;
  name: string;
  brandId: string;
  accountId: string;
}

export interface IIntegrationModel extends Model<IIntegrationDocument> {
  generateLeadDoc(mainDoc: IIntegration, leadData: ILeadData): IIntegration;
  createIntegration(doc: IIntegration): Promise<IIntegrationDocument>;
  createMessengerIntegration(doc: IIntegration): Promise<IIntegrationDocument>;
  updateMessengerIntegration(_id: string, doc: IIntegration): Promise<IIntegrationDocument>;
  saveMessengerAppearanceData(_id: string, doc: IUiOptions): Promise<IIntegrationDocument>;
  saveMessengerConfigs(_id: string, messengerData: IMessengerData): Promise<IIntegrationDocument>;
  createLeadIntegration(doc: IIntegration): Promise<IIntegrationDocument>;
  updateLeadIntegration(_id: string, doc: IIntegration): Promise<IIntegrationDocument>;
  createExternalIntegration(doc: IExternalIntegrationParams): Promise<IIntegrationDocument>;
  removeIntegration(_id: string): void;
}

export const loadClass = () => {
  class Integration {
    /**
     * Generate lead integration data based on the given lead data (leadData)
     * and integration data (mainDoc)
     */
    public static generateLeadDoc(mainDoc: IIntegration, leadData: ILeadData) {
      return {
        ...mainDoc,
        kind: KIND_CHOICES.LEAD,
        leadData,
      };
    }

    /**
     * Create an integration, intended as a private method
     */
    public static createIntegration(doc: IIntegration) {
      return Integrations.create(doc);
    }

    /**
     * Create a messenger kind integration
     */
    public static createMessengerIntegration(doc: IMessengerIntegration) {
      return this.createIntegration({
        ...doc,
        kind: KIND_CHOICES.MESSENGER,
      });
    }

    /**
     * Update messenger integration document
     */
    public static async updateMessengerIntegration(_id: string, doc: IMessengerIntegration) {
      await Integrations.updateOne({ _id }, { $set: doc }, { runValidators: true });

      return Integrations.findOne({ _id });
    }

    /**
     * Save messenger appearance data
     */
    public static async saveMessengerAppearanceData(_id: string, { color, wallpaper, logo }: IUiOptions) {
      await Integrations.updateOne(
        { _id },
        { $set: { uiOptions: { color, wallpaper, logo } } },
        { runValdatiors: true },
      );

      return Integrations.findOne({ _id });
    }

    /**
     * Saves messenger data to integration document
     */
    public static async saveMessengerConfigs(_id: string, messengerData: IMessengerData) {
      await Integrations.updateOne({ _id }, { $set: { messengerData } });
      return Integrations.findOne({ _id });
    }

    /**
     * Create a lead kind integration
     */
    public static createLeadIntegration({ leadData = {}, ...mainDoc }: IIntegration) {
      const doc = this.generateLeadDoc({ ...mainDoc }, leadData);

      if (Object.keys(leadData || {}).length === 0) {
        throw new Error('leadData must be supplied');
      }

      return Integrations.createIntegration(doc);
    }

    /**
     * Create external integrations like facebook, twitter integration
     */
    public static createExternalIntegration(doc: IExternalIntegrationParams): Promise<IIntegrationDocument> {
      return Integrations.createIntegration(doc);
    }

    /**
     * Update lead integration
     */
    public static async updateLeadIntegration(_id: string, { leadData = {}, ...mainDoc }: IIntegration) {
      const doc = this.generateLeadDoc(mainDoc, leadData);

      await Integrations.updateOne({ _id }, { $set: doc }, { runValidators: true });

      return Integrations.findOne({ _id });
    }

    /**
     * Remove integration in addition with its messages, conversations, customers
     */
    public static async removeIntegration(_id: string) {
      const integration = await Integrations.findOne({ _id });

      if (!integration) {
        throw new Error('Integration not found');
      }

      // remove conversations =================
      const conversations = await Conversations.find({ integrationId: _id }, { _id: true });
      const conversationIds = conversations.map(conv => conv._id);

      await ConversationMessages.deleteMany({
        conversationId: { $in: conversationIds },
      });
      await Conversations.deleteMany({ integrationId: _id });

      // Remove customers ==================
      const customers = await Customers.find({ integrationId: _id });
      const customerIds = customers.map(cus => cus._id);

      for (const customerId of customerIds) {
        await Customers.removeCustomer(customerId);
      }

      // Remove form
      if (integration.formId) {
        await Forms.removeForm(integration.formId);
      }

      return Integrations.deleteMany({ _id });
    }
  }

  integrationSchema.loadClass(Integration);

  return integrationSchema;
};

loadClass();

// tslint:disable-next-line
const Integrations = model<IIntegrationDocument, IIntegrationModel>('integrations', integrationSchema);

export default Integrations;
