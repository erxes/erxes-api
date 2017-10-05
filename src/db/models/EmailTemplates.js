import mongoose from 'mongoose';
import shortid from 'shortid';

const EmailTemplateSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  name: String,
  content: String,
});

const EmailTemplates = mongoose.model('email_templates', EmailTemplateSchema);

export default EmailTemplates;
