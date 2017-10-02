import mongoose from 'mongoose';
import { random } from '../utils';

const EmailTemplateSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  name: String,
  content: String,
});

const EmailTemplates = mongoose.model('email_templates', EmailTemplateSchema);

export default EmailTemplates;
