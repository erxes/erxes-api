import mongoose from 'mongoose';
import shortid from 'shortid';

const BrandSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: shortid.generate,
  },
  code: String,
  name: String,
  description: String,
  userId: String,
  createdAt: Date,
  emailConfig: Object,
});

const Brands = mongoose.model('brands', BrandSchema);

export default Brands;
