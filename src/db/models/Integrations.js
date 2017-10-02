import mongoose from 'mongoose';
import utils from '../utils';

const IntegrationSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => utils.random.id(),
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
