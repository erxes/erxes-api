import mongoose from 'mongoose';
import shortid from 'shortid';

const ResponseTemplateSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  name: String,
  content: String,
  brandId: String,
  files: {
    type: Array,
  },
});

const ResponseTemplates = mongoose.model('response_templates', ResponseTemplateSchema);

export default ResponseTemplates;
