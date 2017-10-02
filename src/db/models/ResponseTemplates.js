import mongoose from 'mongoose';
import { random } from '../utils';

const ResponseTemplateSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  name: String,
  content: String,
  brandId: String,
  files: [Object],
});

const ResponseTemplates = mongoose.model('response_templates', ResponseTemplateSchema);

export default ResponseTemplates;
