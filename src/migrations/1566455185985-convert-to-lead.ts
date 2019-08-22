import { Document } from 'mongoose';
import { connect } from '../db/connection';
import { Forms, Integrations, Leads } from '../db/models';
import { IRule } from '../db/models/definitions/common';
import { IFormDocument } from '../db/models/definitions/forms';
import { ICallout } from '../db/models/definitions/leads';

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
    const doc = {
      formId: form._id,
      themeColor: form.themeColor,
      callout: form.callout,
      rules: form.rules,
      createdUserId: form.createdUserId,
      createdDate: form.createdDate,
      viewCount: form.viewCount,
      contactsGathered: form.contactsGathered,
      submissions: form.submissions,
    };

    await Leads.create(doc);

    await Integrations.updateOne(
      { formId: form._id },
      { $set: { kind: 'lead' }, $rename: { formId: 'leadId', formData: 'leadData' } },
    );
  }

  return Promise.resolve('ok');
};
