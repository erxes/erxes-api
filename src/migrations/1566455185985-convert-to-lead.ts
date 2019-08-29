import { Document } from 'mongoose';
import { connect } from '../db/connection';
import { Forms, Integrations } from '../db/models';
import { IRule } from '../db/models/definitions/common';
import { IFormDocument } from '../db/models/definitions/forms';
import { ICallout, IIntegrationDocument, ILeadDataDocument } from '../db/models/definitions/integrations';

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

    if (integration) {
      const leadData = {
        ...integration.formData,
        themeColor: form.themeColor,
        callout: form.callout,
        rules: form.rules,
        createdUserId: form.createdUserId,
        createdDate: form.createdDate,
        viewCount: form.viewCount,
        contactsGathered: form.contactsGathered,
        submissions: form.submissions,
      };

      await Integrations.updateOne({ formId: form._id }, { $set: { kind: 'lead', leadData } });
    }
  }

  return Promise.resolve('ok');
};
