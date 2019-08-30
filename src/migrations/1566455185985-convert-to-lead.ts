import { Document } from 'mongoose';
import { connect } from '../db/connection';
import { Forms, Integrations } from '../db/models';
import { IRule } from '../db/models/definitions/common';
import { IFormDocument } from '../db/models/definitions/forms';
import { ICallout } from '../db/models/definitions/integrations';

module.exports.up = async () => {
  await connect();

  interface ISubmission extends Document {
    customerId: string;
    submittedAt: Date;
  }

  type IFormDocumentExtended = {
    viewCount?: number;
    contactsGathered?: number;
    submissions?: ISubmission[];
    themeColor?: string;
    callout?: ICallout;
    rules?: IRule;
  } & IFormDocument;

  const forms: IFormDocumentExtended[] = await Forms.find();

  for (const form of forms) {
    const integration = await Integrations.findOne({ formId: form._id });

    if (integration && integration.formData) {
      const leadData = {
        loadType: integration.formData.loadType,
        successAction: integration.formData.successAction,
        fromEmail: integration.formData.fromEmail,
        userEmailTitle: integration.formData.userEmailTitle,
        userEmailContent: integration.formData.userEmailContent,
        adminEmails: integration.formData.adminEmails,
        adminEmailTitle: integration.formData.adminEmailTitle,
        adminEmailContent: integration.formData.adminEmailContent,
        thankContent: integration.formData.thankContent,
        redirectUrl: integration.formData.redirectUrl,
        themeColor: form.themeColor,
        callout: form.callout,
        rules: form.rules,
        viewCount: form.viewCount,
        contactsGathered: form.contactsGathered,
        submissions: form.submissions,
      };

      await Integrations.updateOne({ formId: form._id }, { $set: { kind: 'lead', leadData } });
    }
  }

  return Promise.resolve('ok');
};
