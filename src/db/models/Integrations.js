import mongoose from 'mongoose';
import shortid from 'shortid';

const IntegrationSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  kind: String,
  name: String,
  brandId: String,
  formId: String,
  formData: Object,
  messengerData: Object,
  twitterData: Object,
  facebookData: Object,
  uiOptions: Object,
});

const Integrations = mongoose.model('integrations', IntegrationSchema);

export default Integrations;
